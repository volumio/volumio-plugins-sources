import logging
logger = logging.getLogger("Menu Manager")
logger.setLevel(logging.WARNING)
logging.basicConfig()

import json
import re

from subprocess import call
from time import sleep
from datetime import datetime

from rpilcdmenu import *
from rpilcdmenu.items import *


class menu_manager:

    def __init__(self ,controlQ, volumioQ, menuManagerQ):
        self.controlQ = controlQ
        self.volumioQ = volumioQ
        self.menuManagerQ = menuManagerQ

        # menu access times
        self.menuAccessTime = datetime.now()
        self.lastMessageTime = datetime.now()
        self.messageTime = datetime.now()
        
        # log last message for deduplication
        self.lastMessage = ""

        # function menu
        functionMenu = '[{"title":"Radio","uri":"radio"},{"title":"Spotify","uri":"spotify"}]'

        # init menu
        self.menu = RpiLCDMenu(7, 8, [25, 24, 23, 15], scrolling_menu=False)
        self.menu.message(('Initialising...').upper(), autoscroll=True)

        queues = [self.controlQ, self.menuManagerQ]  # put the queues in a list

        while True:
            for queue in queues:
                while not queue.empty():
                    queueItem = queue.get()
                    logger.debug(f"Processing item {queueItem} from queue {queue}")

                    try:
                        if 'control' in queueItem:
                            if (queueItem['control']) == 'vol-up':
                                self.menuAccessTime = datetime.now()
                                self.menu.processDown()
                            elif (queueItem['control']) == 'vol-down':
                                self.menuAccessTime = datetime.now()
                                self.menu.processUp()
                            elif (queueItem['control']) == 'functon-fm-mode':
                                self.menuAccessTime = datetime.now()
                                self.volumioQ.put({'button':'spotify'})
                                # self.menuManagerQ.put({'menu':functionMenu})
                            elif (queueItem['control']) == 'enter':
                                self.menuAccessTime = datetime.now()
                                self.menu.processEnter()
                            elif (queueItem['control']) == 'band':
                                self.menuAccessTime = datetime.now()
                                self.volumioQ.put({'button':'radio'})
                            elif (queueItem['control']) == 'power':
                                self.menuAccessTime = datetime.now()
                                self.volumioQ.put({'button':'power'})
                            elif (queueItem['control']) == 'info':
                                self.menuAccessTime = datetime.now()
                                self.volumioQ.put({'show':'info'})
                            elif (queueItem['control']) == 'memory':
                                self.menuAccessTime = datetime.now()
                                # use getattribute to gather information from menu item
                                # other useful attributes are 'text','menu','function'

                                # get the arguments sent to the menu item (menu name, link to item and service type etc)
                                args = self.menu.items[self.menu.current_option].__getattribute__('args')
                                menuItem = args[0]
                                menuName = args[1]
                                menuLink = args[2]
                                menuService = args[3]

                                # logging
                                logger.debug("Menu item: %s" % menuItem)
                                logger.debug("Menu item name: %s" % menuName)
                                logger.debug("Menu item link: %s" % menuLink)
                                logger.debug("Menu item service: %s" % menuService)

                                # create required json
                                favourite = {}
                                favourite['title'] = menuName
                                favourite['uri'] = menuLink
                                favourite['service'] = menuService
                                logger.debug(favourite)
                                favourite = json.dumps(favourite)

                                # send to queue to create favourite
                                self.volumioQ.put({'memory':favourite})


                        elif 'menu' in queueItem:
                            logger.debug(queueItem['menu'])
                            self.build_menu(queueItem['menu'])

                        elif 'info' in queueItem:
                            logger.debug(queueItem['info'])
                            self.show_track_info(queueItem['info'])

                        elif 'message' in queueItem:
                            logger.debug(queueItem['message'])
                            self.show_message(queueItem['message'])

                        else:
                            logger.warning("Queue item did not match filters: " + str(queueItem))

                        queue.task_done()

                    except Exception as e:
                        logger.error("Failed to process queue item: " + str(e))
                        try:
                            logger.error(f"Failed item {queueItem} from queue {queue}")
                            logger.error("processEnter needs to be resolved in the upstream module")
                        except:
                            logger.error(e)

            sleep(0.2)


    def display_message(self, message, clear=False, static=False, autoscroll=False):
        # clear will clear the display and not render anything after (ie for shut down)
        # static will leave the message on screen, assuming nothing renders over it immedaitely after
        # autoscroll will scroll the message then leave on screen
        # the default will show the message, then render the menu after 2 seconds

        self.messageTime = datetime.now()
        lastMessageTime = (self.messageTime - self.lastMessageTime).total_seconds()

        # check if message is a duplicate, or allow duplicates if last message was longer than 5 seconds ago
        if self.lastMessage != message and lastMessageTime > 2 or lastMessageTime > 5:
             
            if self.menu != None:
                # self.menu.clearDisplay()
                if clear == True:
                    self.menu.message(message.upper())
                    sleep(2)
                    self.lastMessageTime = datetime.now()
                    return self.menu.clearDisplay()
                elif static == True:
                    self.lastMessageTime = datetime.now()
                    self.lastMessage = message
                    return self.menu.message(message.upper(), autoscroll=False)
                elif autoscroll == True:
                    self.lastMessageTime = datetime.now()
                    self.lastMessage = message
                    return self.menu.message(message.upper(), autoscroll=True)
                else:
                    self.menu.message(message.upper())
                    self.lastMessageTime = datetime.now()
                    sleep(2)
                    self.lastMessage = message
                    return self.menu.render()
                
            return self
        else:
            logger.debug("Skipping duplicate message")

    def show_track_info(self, input):
        try:
            logger.debug("Track info args: " + str(input))
            input = json.loads(input)

            for i in input:
                logger.debug("Track info input: " + str(i))

                status = i['status']
                artist = i['artist']
                title = i['title']
                album = i['album']
                bitrate = i['bitrate']
                samplerate = i['samplerate']
                bitdepth = i['bitdepth']
                channels = i['channels']

                tech_info_list = [status, bitrate, samplerate, bitdepth, channels]
                # only join items with a status that isn't None
                tech_info_filtered = ': '.join(str(item) for item in tech_info_list if item is not None)
                tech_info = "({tech})".format(tech=tech_info_filtered)

                first_line_list = [title, artist]
                second_line_list = [album, tech_info]

                # only join items with a status that isn't None
                first_line = ': '.join(str(item) for item in first_line_list if item is not None)
                second_line = ' '.join(str(item) for item in second_line_list if item is not None)

                message = "{first}\n{second}".format(first=first_line, second=second_line)
                self.display_message(message, autoscroll=True)

        except Exception as e:
            logger.error("Failed to process track info: " + str(e))


    def show_message(self, input):
        logger.debug("Message input: " + str(input))
        input = json.loads(input)

        for i in input:
            logger.debug("Message input: " + str(i))
            try:
                type = i['type']
                title = i['title']
                message = i['message']

                message = "{title}\n{message}".format(title=title, message=message)

                self.display_message(message, autoscroll=True)
            except Exception as e:
                logger.error("Failed to process message: " + str(e))



    def build_menu(self, input):

        logger.debug("Message menu: " + str(input))
        input = json.loads(input)
        
        # clear the menu
        if self.menu != None:
            self.menu.items = []

        # parse input
        counter = 0
        for i in input:
            logger.debug("Menu input: " + str(i))
            try:
                buttonName = i.get('title', None)
                buttonLink = i.get('uri', None)
                buttonService = i.get('service', None)

                if buttonService:
                    menuItem = FunctionItem(buttonName, self.resolveItem, [counter, buttonName, buttonLink, buttonService])
                # genres in webradio do not seem to return it's service type, so capture this and resolve
                elif not buttonService and re.match('radio(\/.+)?', buttonLink):
                    menuItem = FunctionItem(buttonName, self.resolveItem, [counter, buttonName, buttonLink, 'webradio'])
                else:
                    menuItem = FunctionItem(buttonName, self.resolveItem, [counter, buttonName, buttonLink])
                # add to main menu
                self.menu.append_item(menuItem)
                counter += 1

            except Exception as e:
                logger.error("Failed to process menu input: " +str(e))
        
        # catch if the submenu sets the index too high, else menu will fail as it cannot select an item
        if self.menu.current_option > (len(self.menu.items) - 1):
            self.menu.current_option = (len(self.menu.items) - 1)

        # return rendered menu
        # if you do not return the menu it will render the original one again
        return self.menu.render()

    def resolveItem(self, item_index, buttonName, buttonLink, buttonService):
        logger.debug("item %d pressed" % (item_index))
        logger.debug("item name: %s" % (buttonName))
        logger.debug("item link: %s" % (buttonLink))
        logger.debug("item link: %s" % (buttonService))
        self.volumioQ.put({'button':buttonLink})

    # exit sub menu
    def exitSubMenu(self, submenu):
        return submenu.exit()

    def dimmer(self):
        self.menu.lcd.displayToggle()

    def render_bars(self, input):
        bar = int(input / 100 * 16)
        bars = '\240' * bar
        return bars

