# https://volumio.github.io/docs/API/API_Overview.html
from time import sleep

import logging
logger = logging.getLogger("Volumio Functions")
logger.setLevel(logging.WARNING)
logging.getLogger('socketio').setLevel(logging.WARNING)
logging.basicConfig()

import json
import socketio
import re
from retrying import retry

class volumio:

    def __init__(self, volumioQ, menuManagerQ):
        self.volumioQ = volumioQ
        self.menuManagerQ = menuManagerQ
        self._waiting = .1


        self.ws_api = "http://localhost:3000"
        self.sio = socketio.Client(logger=True, engineio_logger=True,reconnection=True)
        # self.sio.connect(url=self.ws_api)

        # use retry from the retrying module to reconnect until it's up
        @retry(wait_fixed=1000)
        def connect():
            self.sio.connect(url=self.ws_api)

        connect()

        # define callback functions
        self.sio.on('pushState', self._on_push_state)
        self.sio.on('pushBrowseLibrary', self._on_push_sources)
        self.sio.on('addToFavourites', self._on_response)
        self.sio.on('pushToastMessage', self._on_toast)
        self.sio.on('urifavourites', self._on_response)

        # setup globals
        self.last_state_list = list()

        logger.debug("Get radio sources")
        self.get_sources('radio')

        queues = [self.volumioQ]

        while True:
            for queue in queues:
                while not queue.empty():
                    item = queue.get()

                    try:
                        # parse uri
                        if 'show' in item:
                            if item['show'] == 'info':
                                logger.debug("Hit info")
                                self.get_state()

                        elif 'button' in item:
                            # if it's a stream, play it
                            if re.match('(https|http|spotify:track):(\/\/)?.+(\/)?.+', item['button']):
                                self.play(item['button'])

                            # else list the items below it 
                            elif re.match('(radio|spotify)(\/.+)?', item['button']):
                                self.get_sources(item['button'])

                            # else list the items below it 
                            elif item['button'] == 'power':
                                self.stop()

                            self.volumioQ.task_done()

                        elif 'memory' in item:
                            input = json.loads(item['memory'])
                            logger.debug(input)
                            title = input.get('title', None)
                            uri = input.get('uri', None)
                            service = input.get('service', None)

                            # TODO: search to see if it's already been added and remove in that instance
                            # self.search(title,uri,service)
                            # self.remove_favourite(title,uri,service)
                            self.add_favourite(title,uri,service)

                        else:
                            logger.warning("Queue item did not match filter: " + str(item))

                    except Exception as e:
                        logger.debug("Failed to process queue item: " + str(e))
            sleep(0.2)


    def _send(self, command, args=None, callback=None, namespace=None):
        self.sio.emit(command, args, callback=callback, namespace=namespace)

    def get_state(self):
        logger.debug("Getting state")
        self._send('getState', args=None, callback=self._on_push_state)

    def _on_toast(self, *args):
        try:
            logger.debug("Toast args: " + str(args))
            logger.debug("Toast args length: " + str(len(args)))
            toast = args[0]
            logger.debug("Toast: " + str(toast))

            type = toast.get('type', None)
            title = toast.get('title', None)
            message = toast.get('message', None)

            toast_list = list()
            toast_list.append({
                'type': type,
                'title': title,
                'message': message
            })
            logger.debug("Toast: " + str(toast_list))
            result = json.dumps(toast_list)
            logger.debug("Toast as json: " + str(result))
            self.menuManagerQ.put({'message':result})

        except Exception as e:
            logger.error("Failed to processes incoming toast: " + str(e))

    def _on_response(self, *args):
        logger.debug(args)

    def _on_push_state(self, *args):
        try:
            # logger.debug("State: " + str(args))
            state = args[0]

            # Use dictionary.get('item', None) to get an item from a dictionary and return None if it's missing rather than needing to test for the item
            status = state.get('status', None)
            position = state.get('position', None)
            title = state.get('title', None)
            artist = state.get('artist', None)
            album = state.get('album', None)
            uri = state.get('uri', None)
            trackType = state.get('trackType', None)
            seek = state.get('seek', None)
            duration = state.get('duration', None)           
            bitrate = state.get('bitrate', None)
            samplerate = state.get('samplerate', None)
            bitdepth = state.get('bitdepth', None)            
            channels = state.get('channels', None)            
            random = state.get('random', None)            
            repeatSingle = state.get('repeatSingle', None)            
            consume = state.get('consume', None)            
            volume = state.get('volume', None)            
            dbVolume = state.get('dbVolume', None)            
            mute = state.get('mute', None)            
            disableVolumeControl = state.get('disableVolumeControl', None)            
            stream = state.get('stream', None)            
            updatedb = state.get('updatedb', None)            
            volatile = state.get('volatile', None)            
            service = state.get('service', None)

            state_list = list()
            state_list.append({
                'status': status,
                'artist': artist,
                'title': title,
                'album': album,
                'uri': uri,
                'service': service,
                'bitrate': bitrate,
                'samplerate': samplerate,
                'bitdepth': bitdepth,
                'channels': channels
            })


            # replace any occurences of null or "" with None so we can just check for None
            clean_state_list = [{k: None if v == "" else v for k, v in d.items()} for d in state_list]
            
            # check for missing items
            key_to_check = ['artist', 'title']
            all_none = True

            for dictionary in clean_state_list:
                if not all(dictionary[key] is None for key in key_to_check):
                    all_none = False
                    break

            # if theres too many missing items log it and skip the rest
            if status == 'play'and all_none:
                logger.debug("Now playing item missing state")
            # check if we're not actually playing anything.
            # This happens between every track change so don't show anything in this instance else we spam the display with 'stop' events.
            elif status != 'play' and all_none:
                logger.debug("Nothing playing and no information")
            # state hasn't changed
            # elif clean_state_list == self.last_state_list:
            #     logger.debug("State not changed")
            else:
                result = json.dumps(clean_state_list)
                self.last_state_list = clean_state_list
                logger.debug("State list was this before cleaning: %s" % state_list)
                logger.debug("Sending clean state list: %s" % result)
                self.menuManagerQ.put({'info':result})


        except Exception as e:
            logger.error("Failed to processes incoming state: " + str(e))
            

    def _on_push_sources(self, *args):
        try:
            logger.debug(args)

            sources_list = list()

            # Some sources are a mix of list items and sorces, so iterate over all of them
            # use the below to revert
            # sources = args[0]['navigation']['lists'][0]['items']

            main_source = args[0]['navigation']['lists']
            for lists in main_source:

                sources = lists['items']

                for source in sources:
                    try:
                        if 'service' in source:
                            sources_list.append({
                                'title': source.get('title', None),
                                'uri': source.get('uri', None),
                                'service': source.get('service', None)
                            })
                        else:
                            sources_list.append({
                                'title': source.get('title', None),
                                'uri': source.get('uri', None)
                            })

                    except Exception as e:
                        logger.error("Failed to process source: " + str(source))
            
            result = json.dumps(sources_list)
            self.menuManagerQ.put({'menu':result})
        except Exception as e:
            logger.error("Failed to processes incoming source: " + str(e))


    def get_sources(self, link):
        logger.debug("Get sources from %s" % link)
        self._send('browseLibrary', {'uri':link}, callback=self._on_push_sources)

    def add_favourite(self, title, link, service):
        logger.debug(f"Add {title} from {link} to {service} favourites")
        self._send('addToFavourites', {'uri':link, 'title':title, 'service':service})

    def remove_favourite(self, title, link, service):
        logger.debug(f"Remove {title} from {link} to {service} favourites")
        self._send('removeFromFavourites', {'uri':link, 'title':title, 'service':service})

    def search(self, title, link, service, playlist=None):
        # TODO:
        # this feature does not work as search query is not documented
        # https://volumio.github.io/docs/API/WebSocket_APIs.html
        # https://community.volumio.org/t/rest-api-uri-for-browsing/10671
        logger.debug(f"Search for {title} from {link} in {service}")
        if playlist:
            self._send('search', {'uri':link, 'title':title, 'service':service, 'playlist':playlist})
        else:
            self._send('search', {'uri':link, 'title':title, 'service':service})

    
    def play(self, uri):
        self._send('clearQueue')
        if re.match('(https|http):\/\/.+\/.+', uri):
            self._send('addPlay', {'status':'play', 'service':'webradio', 'uri':uri})
        elif re.match('spotify:track:.+', uri):
            self._send('addPlay', {'status':'play', 'service':'spotify', 'uri':uri})
        else:
            logger.debug("URi does not match webradio or spotify: " + str(uri))

    def stop(self):
        self._send('stop')
        self._send('clearQueue')
