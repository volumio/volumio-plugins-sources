#!/usr/bin/env python3

import os
import os.path
from io import BytesIO
import sys
import signal
from math import ceil, floor
import json
from time import strftime, gmtime, sleep, time  # v.0.0.7
from threading import Thread
from PIL import ImageFont, Image, ImageDraw, ImageStat, ImageFilter
import ST7789  # v0.0.6
import socketio
import requests
from numpy import mean
import RPi.GPIO as GPIO
# import logging
# logging.getLogger('socketIO-client').setLevel(logging.DEBUG)
# logging.basicConfig()

# get the path of the script
SCRIPT_PATH = os.path.dirname(os.path.abspath(__file__))
# set script path as current directory
os.chdir(SCRIPT_PATH)


# Create ST7789 LCD Display class.
DISP = ST7789.ST7789(
    height=240,  # v0.0.6
    width=240,  # v0.0.6
    rotation=90,  # Needed to display the right way up on Pirate Audio
    port=0,       # SPI port
    cs=1,         # SPI port Chip-select channel
    dc=9,         # BCM pin used for data/command
    backlight=13,
    spi_speed_hz=80 * 1000 * 1000,
    offset_left=0,  # v0.0.6
    offset_top=0  # v0.0.6
)

# Create Socketio client
SOCKETIO = socketio.Client()

# read json file (plugin values)
with open('/data/configuration/system_hardware/pirateaudio/config.json', 'r') as myfile:
    DATA = myfile.read()
OBJ = json.loads(DATA)

# read json file (volumio language)
with open('/data/configuration/miscellanea/appearance/config.json', 'r') as mylangfile:
    DATA_LANG = mylangfile.read()
OBJ_LANG = json.loads(DATA_LANG)
LANGCODE = OBJ_LANG['language_code']['value']
LANGPATH = ''.join(['/data/plugins/system_hardware/pirateaudio/i18n/strings_', LANGCODE, '.json'])  # v0.0.7
if os.path.exists(LANGPATH) is False:  # fallback to en as default language
    LANGPATH = '/data/plugins/system_hardware/pirateaudio/i18n/strings_en.json'

# read json file (language file for translation)
with open(LANGPATH, 'r') as mytransfile:
    DATA_TRANS = mytransfile.read()
OBJ_TRANS = json.loads(DATA_TRANS)

TITLE_QUEUE, LEN_QUEUE = [], 0  # v.0.0.4
NAV_ARRAY_NAME, NAV_ARRAY_URI, NAV_ARRAY_TYPE, NAV_ARRAY_SERVICE = [], [], [], []
FONT_DICT = {
    "FONT_S": ImageFont.truetype(''.join([SCRIPT_PATH, '/fonts/Roboto-Medium.ttf']), 20),
    "FONT_M": ImageFont.truetype(''.join([SCRIPT_PATH, '/fonts/Roboto-Medium.ttf']), 24),
    "FONT_L": ImageFont.truetype(''.join([SCRIPT_PATH, '/fonts/Roboto-Medium.ttf']), 30),
    "FONT_FAS": ImageFont.truetype(''.join([SCRIPT_PATH, '/fonts/FontAwesome5-Free-Solid.otf']), 28)
}
IMAGE_DICT = {
    "WIDTH": 240,
    "HEIGHT": 240,
    "BG_DEFAULT": Image.open('images/default.jpg').resize((240, 240)),
    "IMG": Image.open('images/default.jpg').resize((240, 240)),
    "IMG2": Image.open('images/default.jpg').resize((240, 240)),
    "IMG3": '',
    "IMG_CHECK": '',
    "LASTREFRESH": 0
}
VOLUMIO_DICT = {
    "ALBUMART": '',
    "MODE": 'player',
    "POSITION": None,
    "STATUS": '',
    "SERVICE": '',
    "SEEK": 0,
    "VOLUME": 0,
    "DURATION": 0,
    #"STATE_LAST": ''
    "STATE_LAST": None
}
NAV_DICT = {
    "MARKER": 0,
    "LISTMAX": int(OBJ['listmax']['value']),
    "LISTSTART": 0,
    "LISTRESULT": 0
}
OVERLAY_DICT = {
    "TXT_COL": (255, 255, 255),
    "STR_COL": (15, 15, 15),
    "BAR_BGCOL": (200, 200, 200),
    "BAR_COL": (255, 255, 255),
    "DARK": False
}

BUTTONS = [5, 6, 16, OBJ['gpio_ybutton']['value']]
# LABELS = ['A', 'B', 'X', 'Y']
GPIO.setmode(GPIO.BCM)  # Set up RPi.GPIO with BCM numbering scheme

# debug
# import PIL
# print('PIL',PIL.__version__)


def clean(*args):
    """cleanes up at exit, even if service is stopped"""
    display_stuff(IMAGE_DICT['BG_DEFAULT'], OBJ_TRANS['DISPLAY']['SHUTDOWN'], 0, 0, 'info')  # v0.0.7
    sleep(1)  # v0.0.7
    DISP.set_backlight(False)
    GPIO.cleanup(BUTTONS)  # v0.0.4
    sys.exit(0)


for sig in (signal.SIGABRT, signal.SIGILL, signal.SIGINT, signal.SIGSEGV, signal.SIGTERM):
    signal.signal(sig, clean)


@SOCKETIO.event
def connect():
    """execute some stuff on connect"""
    # start_time = time()  # debug, time of code execution
    SOCKETIO.emit('getState', '')
    SOCKETIO.emit('getQueue')
    # print("on_connect--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


@SOCKETIO.event
def disconnect():
    """changes display on disconnect"""
    display_stuff(IMAGE_DICT['BG_DEFAULT'], OBJ_TRANS['DISPLAY']['LOSTCONNECTION'], 0, 0, 'info')


def navigation_handler():
    """build navigation menu"""
    # start_time = time()  # debug, time of code execution
    global VOLUMIO_DICT, NAV_ARRAY_NAME, NAV_ARRAY_URI, NAV_ARRAY_TYPE, NAV_DICT
    if VOLUMIO_DICT['MODE'] == 'player':
        VOLUMIO_DICT['MODE'] = 'menu'
        emit_action = ['setSleep', {'enabled': 'true', 'time': strftime("%H:%M", gmtime(OBJ['sleeptimer']['value']*60))}]
        NAV_ARRAY_NAME = [OBJ_TRANS['DISPLAY']['MUSICSELECTION'], OBJ_TRANS['DISPLAY']['SEEK'], OBJ_TRANS['DISPLAY']['PREVNEXT'], 'Sleeptimer ' + str(OBJ['sleeptimer']['value']) + 'M', OBJ_TRANS['DISPLAY']['SHUTDOWN'], OBJ_TRANS['DISPLAY']['REBOOT']]
        NAV_ARRAY_URI = ['', 'seek', 'prevnext', emit_action, 'shutdown', 'reboot']
        NAV_ARRAY_TYPE = ['', 'seek', 'prevnext', 'emit', 'emit', 'emit']
        NAV_DICT['LISTRESULT'] = 6
        display_stuff(IMAGE_DICT['BG_DEFAULT'], NAV_ARRAY_NAME, NAV_DICT['MARKER'], NAV_DICT['LISTSTART'])
    # else:
        # print('else navigation_handler() eingetreten')
    # print("navigation_handler--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


@SOCKETIO.on('pushBrowseSources')
def on_push_browsesources(*args):
    """processes websocket informations of browsesources"""
    # start_time = time()  # debug, time of code execution
    if VOLUMIO_DICT['MODE'] == 'navigation':  # v.0.0.4 added, to make sure this getting not displayed on_connect
        global NAV_DICT, NAV_ARRAY_NAME, NAV_ARRAY_URI
        NAV_DICT['LISTRESULT'] = len(args[0])
        NAV_ARRAY_NAME = [args[0][i]['name'] for i in range(NAV_DICT['LISTRESULT']) if VOLUMIO_DICT['MODE'] == 'navigation']
        NAV_ARRAY_URI = [args[0][i]['uri'] for i in range(NAV_DICT['LISTRESULT']) if VOLUMIO_DICT['MODE'] == 'navigation']
        display_stuff(IMAGE_DICT['BG_DEFAULT'], NAV_ARRAY_NAME, NAV_DICT['MARKER'], 0)
    # print("on_push_browsesources--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


@SOCKETIO.on('pushBrowseLibrary')
def on_push_browselibrary(*args):
    """processes websocket informations of browselibrary"""
    # start_time = time()  # debug, time of code execution
    global NAV_DICT, NAV_ARRAY_SERVICE, NAV_ARRAY_TYPE, NAV_ARRAY_NAME, NAV_ARRAY_URI
    reset_variable('navigation')
    NAV_DICT['LISTRESULT'] = len(args[0]['navigation']['lists'][0]['items'])  # v.0.0.4 code cleaning
    if NAV_DICT['LISTRESULT'] > 0:  # we have item entries
        NAV_ARRAY_SERVICE = [args[0]['navigation']['lists'][0]['items'][i]['service'] for i in range(NAV_DICT['LISTRESULT']) if 'service' in args[0]['navigation']['lists'][0]['items'][i]]
        NAV_ARRAY_TYPE = [args[0]['navigation']['lists'][0]['items'][i]['type'] for i in range(NAV_DICT['LISTRESULT'])]
        NAV_ARRAY_NAME = [args[0]['navigation']['lists'][0]['items'][i]['title'] for i in range(NAV_DICT['LISTRESULT']) if 'title' in args[0]['navigation']['lists'][0]['items'][i]]
        NAV_ARRAY_URI = [args[0]['navigation']['lists'][0]['items'][i]['uri'] for i in range(NAV_DICT['LISTRESULT']) if 'uri' in args[0]['navigation']['lists'][0]['items'][i]]
        display_stuff(IMAGE_DICT['BG_DEFAULT'], NAV_ARRAY_NAME, NAV_DICT['MARKER'], NAV_DICT['LISTSTART'])
    elif NAV_DICT['LISTRESULT'] == 0:  # we have no item entries
        display_stuff(IMAGE_DICT['BG_DEFAULT'], OBJ_TRANS['DISPLAY']['EMPTY'], NAV_DICT['MARKER'], NAV_DICT['LISTSTART'])
    # print("on_push_browselibrary--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


def reset_variable(varmode):
    """resets variables"""
    # start_time = time()  # debug, time of code execution
    global VOLUMIO_DICT, NAV_ARRAY_SERVICE, NAV_ARRAY_NAME, NAV_ARRAY_URI, NAV_ARRAY_TYPE, NAV_DICT, IMAGE_DICT
    VOLUMIO_DICT['MODE'] = varmode
    del NAV_ARRAY_NAME[:]
    del NAV_ARRAY_URI[:]
    del NAV_ARRAY_TYPE[:]
    del NAV_ARRAY_SERVICE[:]
    NAV_DICT['MARKER'], NAV_DICT['LISTSTART'] = 0, 0
    IMAGE_DICT['IMG_CHECK'], VOLUMIO_DICT['ALBUMART'], VOLUMIO_DICT['STATE_LAST'] = '', '', None  # reset albumart so display gets refreshed
    # print("reset_variable--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


def sendtodisplay(img4):
    """send img to display"""
    # start_time = time()  # debug, time of code execution
    global IMAGE_DICT
    IMAGE_DICT['LASTREFRESH'] = time()
    DISP.display(img4)
    # print("sendtodisplay--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


def display_stuff(picture, text, marked, start, icons='nav'):  # v.0.0.4 test for better performance
    """create image and overlays"""
    # start_time = time()  # debug, time of code execution
    global NAV_DICT  # v.0.0.4

    def f_drawtext(x, y, text, fontstring, fillstring=(255, 255, 255)):
        """draw text"""
        draw3.text((x, y), text, font=fontstring, fill=fillstring)

    def f_drawsymbol(x, y, text, fontstring=FONT_DICT['FONT_FAS'], fillstring=(255, 255, 255)):
        """draw symbols"""
        draw3.text((x, y), text, font=fontstring, fill=fillstring)

    def f_textcontent(text, start, listmax1):
        """draw content"""
        # start_time2 = time()  # debug, time of code execution
        if isinstance(text, list):  # check if text is array
            result = len(text)  # count items of list/array
            totaltextheight = 0
            i = 0
            # Loop for finding out the sum of textheight for positioning, only text to display
            listbis = start + listmax1
            if listbis > result:
                listbis = result
            for i in range(start, listbis):  # v.0.0.4 range max werteliste
                totaltextheight += f_xy(text[0+i], FONT_DICT['FONT_M'])[1]
            Y = (IMAGE_DICT['HEIGHT'] // 2) - (totaltextheight // 2)  # startheight
            i = 0

            # Loop for creating text to display
            for i in range(start, listbis):  # v.0.0.4
                XY = f_xy(text[0+i], FONT_DICT['FONT_M'])
                hei1 = XY[1]
                X2 = XY[2]
                if X2 < 0:  # v.0.0.4 dont center text if to long
                    X2 = 0
                if i == marked:
                    draw3.rectangle((X2, Y + 2, X2 + XY[0], Y + hei1), (255, 255, 255))
                    f_drawtext(X2, Y, text[0+i], FONT_DICT['FONT_M'], (0, 0, 0))
                else:
                    f_drawtext(X2 + 3, Y + 3, text[0+i], FONT_DICT['FONT_M'], (15, 15, 15))
                    f_drawtext(X2, Y, text[0+i], FONT_DICT['FONT_M'])
                Y += hei1  # add line to startheigt for next entry
        else:
            result = 1  # needed for right pageindex
            XY = f_xy(text, FONT_DICT['FONT_M'])
            len1 = XY[0]
            hei1 = XY[1]
            X2 = XY[2]
            y2 = XY[3]
            draw3.rectangle((X2, y2, X2 + len1, y2 + hei1), (255, 255, 255))
            f_drawtext(X2, y2, text, FONT_DICT['FONT_M'], (0, 0, 0))
        # print("def_ftextcontent--- %s seconds ---" % (time() - start_time2))  # debug, time of code execution
        return result

    def f_xy(text, font):
        """helper for width and height of text"""
        len1, hei1 = draw3.textsize(text, font)
        x = (IMAGE_DICT['WIDTH'] - len1)//2
        Y = (IMAGE_DICT['HEIGHT'] - hei1)//2
        return [len1, hei1, x, Y]

    def f_page(marked, listmax2, result):
        """pageindicator"""
        page = int(ceil((float(marked) + 1)/float(listmax2)))
        pages = int(ceil(float(result)/float(listmax2)))
        if pages != 1:  # only show index if more than one site
            pagestring = ''.join([str(page), '/', str(pages)])
            XY = f_xy(pagestring, FONT_DICT['FONT_M'])
            f_drawtext(XY[2], IMAGE_DICT['HEIGHT'] - XY[1], pagestring, FONT_DICT['FONT_M'])

    if picture == IMAGE_DICT['BG_DEFAULT']:
        IMAGE_DICT['IMG3'] = IMAGE_DICT['BG_DEFAULT'].copy()
    else:
        IMAGE_DICT['IMG3'] = Image.open(picture).convert('RGBA')  # v.0.0.4
    draw3 = ImageDraw.Draw(IMAGE_DICT['IMG3'], 'RGBA')
    result = f_textcontent(text, start, NAV_DICT['LISTMAX'])
    # draw symbols
    if icons == 'nav':
        f_drawsymbol(0, 50, u"\uf14a")  # Fontawesome symbol ok
        f_drawsymbol(210, 50, u"\uf151")  # Fontawesome symbol up
        f_drawsymbol(0, 170, u"\uf0e2")  # Fontawesome symbol back
        f_drawsymbol(210, 170, u"\uf150")  # Fontawesome symbol down
    elif icons == 'info':
        f_drawsymbol(10, 10, u"\uf05a")  # Fontawesome symbol info
    elif icons == 'seek':
        f_drawsymbol(210, 50, u"\uf04e")  # Fontawesome symbol forward
        f_drawsymbol(0, 170, u"\uf0e2")  # Fontawesome symbol back
        f_drawsymbol(210, 170, u"\uf04a")  # Fontawesome symbol backward
    f_page(marked, NAV_DICT['LISTMAX'], result)
    sendtodisplay(IMAGE_DICT['IMG3'])
    # print("displaystuff--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


# position in code is important, so display_stuff works v.0.0.4
display_stuff(IMAGE_DICT['BG_DEFAULT'], OBJ_TRANS['DISPLAY']['WAIT'], 0, 0, 'info')
SOCKETIO.connect('http://localhost:3000')

def seeking(direction):
    """processes seeking commands"""
    # start_time = time()  # debug, time of code execution
    global VOLUMIO_DICT
    step = 60000  # 60 seconds
    if direction == '+':
        if int(float((VOLUMIO_DICT['SEEK'] + step)/1000)) < VOLUMIO_DICT['DURATION']:
            VOLUMIO_DICT['SEEK'] += step
            SOCKETIO.emit('seek', int(float(VOLUMIO_DICT['SEEK']/1000)))
            display_stuff(IMAGE_DICT['BG_DEFAULT'], [OBJ_TRANS['DISPLAY']['SEEK'], ''.join([strftime("%M:%S", gmtime(int(float(VOLUMIO_DICT['SEEK']/1000)))), ' / ', strftime("%M:%S", gmtime(VOLUMIO_DICT['DURATION']))])], 0, 0, 'seek')
    else:
        if int(float((VOLUMIO_DICT['SEEK'] - step)/1000)) > 0:
            VOLUMIO_DICT['SEEK'] -= step
            SOCKETIO.emit('seek', int(float(VOLUMIO_DICT['SEEK']/1000)))
            display_stuff(IMAGE_DICT['BG_DEFAULT'], [OBJ_TRANS['DISPLAY']['SEEK'], ''.join([strftime("%M:%S", gmtime(int(float(VOLUMIO_DICT['SEEK']/1000)))), ' / ', strftime("%M:%S", gmtime(VOLUMIO_DICT['DURATION']))])], 0, 0, 'seek')
    # print("seeking--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


def prevnext(direction):
    """processes prev/next commands"""
    # start_time = time()  # debug, time of code execution
    global VOLUMIO_DICT
    if VOLUMIO_DICT['POSITION'] is not None:  # v.0.0.7 as some music service dont push position
        if direction == 'prev':
            VOLUMIO_DICT['POSITION'] -= 1
        else:
            VOLUMIO_DICT['POSITION'] += 1
        if VOLUMIO_DICT['POSITION'] > LEN_QUEUE - 1:  # set position to first entry to loop through playlist infinite
            VOLUMIO_DICT['POSITION'] = 0
        elif VOLUMIO_DICT['POSITION'] < 0:  # set position to last entry to loop through playlist infinite
            VOLUMIO_DICT['POSITION'] = LEN_QUEUE - 1
        display_stuff(IMAGE_DICT['BG_DEFAULT'], [''.join([str(VOLUMIO_DICT['POSITION'] + 1), '/', str(LEN_QUEUE)]), OBJ_TRANS['DISPLAY']['PREVNEXT'], TITLE_QUEUE[VOLUMIO_DICT['POSITION']]], 1, 0, 'seek')
        SOCKETIO.emit('stop')
        SOCKETIO.emit('play', {"value": VOLUMIO_DICT['POSITION']})
    # print("prevnext--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


@SOCKETIO.on('pushQueue')
def on_push_queue(*args):
    """processes websocket informations of queue"""
    # start_time = time()  # debug, time of code execution
    global TITLE_QUEUE, LEN_QUEUE
    del TITLE_QUEUE[:]
    LEN_QUEUE = 0  # v.0.0.7
    if args[0]:  # v.0.0.7
        LEN_QUEUE = len(args[0])
        TITLE_QUEUE = [args[0][i]['name'] for i in range(LEN_QUEUE)]
    # print("on_push_queue--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


@SOCKETIO.on('pushState')
def on_push_state(*args):
    """processes websocket informations of push state"""
    # start_time = time()  # debug, time of code execution
    global IMAGE_DICT, OVERLAY_DICT, VOLUMIO_DICT
    # WS_CONNECTED = True
    # test to get rid of unneeded, empty screen refreshs
    if not args[0]['title'] and not args[0]['artist'] and not args[0]['album'] and LEN_QUEUE > 0:
        return

    #check to not process multiple identical getstates
    state = ''.join([args[0]['status'], args[0]['title'], str(args[0]['volume']), str(args[0]['seek'])])
    if VOLUMIO_DICT['STATE_LAST'] == state:
        skip = True
    else:
        VOLUMIO_DICT['STATE_LAST'] = state
        skip = False


    def f_textsize(text, fontsize):
        """"helper textsize"""
        w1, y1 = draw.textsize(text, fontsize)
        return w1

    def f_drawtext(x, y, text, fontstring, fillstring):
        """draw text"""
        draw.text((x, y), text, font=fontstring, fill=fillstring)

    def f_x1(textwidth):
        """helper textwidth"""
        if textwidth <= IMAGE_DICT['WIDTH']:
            x1 = (IMAGE_DICT['WIDTH'] - textwidth)//2
        else:
            x1 = 0
        return x1

    def f_content(field, fontsize, top, shadowoffset=1):
        """draw content"""
        if field in args[0]:
            if args[0][field] is not None:
                w1 = f_textsize(args[0][field], fontsize)
                x1 = f_x1(w1)
                f_drawtext(x1 + shadowoffset, top + shadowoffset, args[0][field], fontsize, OVERLAY_DICT['STR_COL'])  # shadow
                f_drawtext(x1, top, args[0][field], fontsize, OVERLAY_DICT['TXT_COL'])

    def f_background(albumurl):
        """helper background"""
        global VOLUMIO_DICT, IMAGE_DICT, OVERLAY_DICT
        if albumurl == VOLUMIO_DICT['ALBUMART']:
            IMAGE_DICT['IMG'] = IMAGE_DICT['IMG2'].copy()
        else:
            VOLUMIO_DICT['ALBUMART'] = albumurl
            albumart2 = albumurl
            if not albumart2:  # v0.0.7 hint pylint
                albumart2 = 'http://localhost:3000/albumart'
            if 'http' not in albumart2:
                albumart2 = ''.join(['http://localhost:3000', VOLUMIO_DICT['ALBUMART']])
            response = requests.get(albumart2)
            try:  # to catch not displayable images
                IMAGE_DICT['IMG'] = Image.open(BytesIO(response.content)).convert('RGBA')  # v.0.04 gab bei spotify probleme
                IMAGE_DICT['IMG'] = IMAGE_DICT['IMG'].resize((IMAGE_DICT['WIDTH'], IMAGE_DICT['HEIGHT']))
                IMAGE_DICT['IMG'] = IMAGE_DICT['IMG'].filter(ImageFilter.BLUR)  # Blur
            except (ValueError, RuntimeError) as e:
                IMAGE_DICT['IMG'] = IMAGE_DICT['BG_DEFAULT'].copy()

            IMAGE_DICT['IMG2'] = IMAGE_DICT['IMG'].copy()
            f_textcontrast(IMAGE_DICT['IMG'])  # to get the right values in TXT_COL, STR_COL, BAR_BGCOL, BAR_COL, DARK
        return IMAGE_DICT['IMG']

    def f_textcontrast(image):
        """helper contrast"""
        global OVERLAY_DICT
        im_stat = ImageStat.Stat(image)
        im_mean = im_stat.mean
        mn = mean(im_mean)
        OVERLAY_DICT['TXT_COL'] = (255, 255, 255)
        OVERLAY_DICT['STR_COL'] = (15, 15, 15)
        OVERLAY_DICT['BAR_BGCOL'] = (200, 200, 200)
        OVERLAY_DICT['BAR_COL'] = (255, 255, 255)
        OVERLAY_DICT['DARK'] = False
        if mn > 175:
            OVERLAY_DICT['TXT_COL'] = (55, 55, 55)
            OVERLAY_DICT['STR_COL'] = (200, 200, 200)  # v0.0.4 needed for shadow
            OVERLAY_DICT['DARK'] = True
            OVERLAY_DICT['BAR_BGCOL'] = (255, 255, 255)
            OVERLAY_DICT['BAR_COL'] = (100, 100, 100)
        if mn < 80:
            OVERLAY_DICT['TXT_COL'] = (200, 200, 200)

    def f_displayoverlay(varstatus):
        """displayoverlay"""
        if varstatus == 'play':
            f_drawtext(4, 53, u"\uf04C", FONT_DICT['FONT_FAS'], OVERLAY_DICT['TXT_COL'])
        else:
            f_drawtext(4, 53, u"\uf04b", FONT_DICT['FONT_FAS'], OVERLAY_DICT['TXT_COL'])
        f_drawtext(210, 53, u"\uf0c9", FONT_DICT['FONT_FAS'], OVERLAY_DICT['TXT_COL'])
        f_drawtext(210, 174, u"\uf028", FONT_DICT['FONT_FAS'], OVERLAY_DICT['TXT_COL'])

        # text
        f_content('artist', FONT_DICT['FONT_M'], 7, 2)
        f_content('album', FONT_DICT['FONT_M'], 35, 2)
        f_content('title', FONT_DICT['FONT_L'], 105, 2)

        # volumebar
        draw.rectangle((5, 184, IMAGE_DICT['WIDTH']-34, 184 + 8), OVERLAY_DICT['BAR_BGCOL'])  # background
        draw.rectangle((5, 184, int((float(VOLUMIO_DICT['VOLUME'])/100)*(IMAGE_DICT['WIDTH'] - 33)), 184 + 8), OVERLAY_DICT['BAR_COL'])  # foreground

    def f_timebar(args):
        """helper timebar"""
        global VOLUMIO_DICT
        if 'duration' in args[0]:
            VOLUMIO_DICT['DURATION'] = args[0]['duration']  # seconds
            if VOLUMIO_DICT['DURATION'] != 0:
                if 'seek' in args[0] and args[0]['seek'] is not None:
                    VOLUMIO_DICT['SEEK'] = args[0]['seek']  # time elapsed seconds
                    draw.rectangle((5, 230, IMAGE_DICT['WIDTH']-5, 230 + 8), OVERLAY_DICT['BAR_BGCOL'])  # background
                    draw.rectangle((5, 230, int((float(int(float(args[0]['seek'])/1000))/float(int(float(args[0]['duration']))))*(IMAGE_DICT['WIDTH']-10)), 230 + 8), OVERLAY_DICT['BAR_COL'])

                    # v0.0.4 show remaining time of track
                    # print('a;',strftime("%H:%M:%S", gmtime(DURATION - int(float(SEEK)/1000))))
                    # print('B;',strftime("%-H", gmtime(DURATION - int(float(SEEK)/1000))))
                    hour = strftime("%-H", gmtime(VOLUMIO_DICT['DURATION'] - int(float(VOLUMIO_DICT['SEEK'])/1000)))
                    if hour == '0':
                        remaining = ''.join(['-', strftime("%M:%S", gmtime(VOLUMIO_DICT['DURATION'] - int(float(VOLUMIO_DICT['SEEK'])/1000)))])
                    else:
                        minute = strftime("%-M", gmtime(VOLUMIO_DICT['DURATION'] - int(float(VOLUMIO_DICT['SEEK'])/1000)))
                        minute = str((int(hour)*60) + int(minute))
                        remaining = ''.join(['-', minute, ':', strftime("%S", gmtime(VOLUMIO_DICT['DURATION'] - int(float(VOLUMIO_DICT['SEEK'])/1000)))])
                    # print('remaining:', remaining)

                    #remaining = ''.join(['-', strftime("%M:%S", gmtime(DURATION - int(float(SEEK)/1000)))])
                    w4 = f_textsize(remaining, FONT_DICT['FONT_M'])
                    f_drawtext(IMAGE_DICT['WIDTH'] - w4 - 2 + 2, 206 - 2 + 2, remaining, FONT_DICT['FONT_M'], OVERLAY_DICT['STR_COL'])  # shadow, fill by mean
                    f_drawtext(IMAGE_DICT['WIDTH'] - w4 - 2, 206 - 2, remaining, FONT_DICT['FONT_M'], OVERLAY_DICT['TXT_COL'])  # fill by mean

    if VOLUMIO_DICT['MODE'] == 'player' and not skip:
        VOLUMIO_DICT['VOLUME'] = int(args[0]['volume'])
        if 'position' in args[0]:
            VOLUMIO_DICT['POSITION'] = args[0]['position']  # v.0.0.7 as some music service dont push position
        VOLUMIO_DICT['STATUS'] = args[0]['status']  # v0.0.6
        VOLUMIO_DICT['SERVICE'] = args[0]['service']  # v0.0.6
        IMAGE_DICT['IMG'] = f_background(args[0]['albumart'].encode('ascii', 'ignore').decode('utf-8'))
        draw = ImageDraw.Draw(IMAGE_DICT['IMG'], 'RGBA')

        f_displayoverlay(VOLUMIO_DICT['STATUS'])
        f_timebar(args)

        # display only if img changed
        if IMAGE_DICT['IMG_CHECK'] != IMAGE_DICT['IMG']:
            IMAGE_DICT['IMG_CHECK'] = IMAGE_DICT['IMG']
            sendtodisplay(IMAGE_DICT['IMG'])
    # print("on_push_state--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


# IMG = Image.new('RGBA', (240, 240), color=(0, 0, 0, 25))  # v.0.0.7 not needed, as we always open an image
# draw = ImageDraw.Draw(IMG, 'RGBA') v.0.0.7


def handle_button(pin):
    if pin == 5:
        button_a(VOLUMIO_DICT['MODE'], VOLUMIO_DICT['STATUS'])
    if pin == 6:
        button_b(VOLUMIO_DICT['MODE'], VOLUMIO_DICT['STATUS'])
    if pin == 16:
        button_x(VOLUMIO_DICT['MODE'], VOLUMIO_DICT['STATUS'])
    if pin == BUTTONS[3]:
        button_y(VOLUMIO_DICT['MODE'], VOLUMIO_DICT['STATUS'])


def button_a(mode, status):  # optimieren, VOLUMIO_DICT['MODE'] durch mode (lokale variable) ersetzen
    #print('button_a, mode:', mode, 'pin:', pin)
    browselibrary = False
    if mode == 'player':
        if (status == 'play') and (VOLUMIO_DICT['SERVICE'] == 'webradio'):
            SOCKETIO.emit('stop')
        elif status == 'play':
            SOCKETIO.emit('pause')
        else:
            SOCKETIO.emit('play')
    #elif mode == 'navigation':
    if mode == 'navigation':
        if NAV_ARRAY_URI:  # v.0.0.7
            if not NAV_ARRAY_TYPE:  # v.0.0.7
                browselibrary = True
            else:
                if NAV_ARRAY_TYPE[NAV_DICT['MARKER']] in ['song', 'webradio', 'mywebradio']:  # v.0.0.7 hint pylint
                    SOCKETIO.emit('replaceAndPlay', {"service": NAV_ARRAY_SERVICE[NAV_DICT['MARKER']], "type": NAV_ARRAY_TYPE[NAV_DICT['MARKER']], "title": NAV_ARRAY_NAME[NAV_DICT['MARKER']], "uri": NAV_ARRAY_URI[NAV_DICT['MARKER']]})
                    reset_variable('player')
                    return
                #elif NAV_ARRAY_TYPE[NAV_DICT['MARKER']] == 'playlist' and NAV_ARRAY_SERVICE[NAV_DICT['MARKER']] == 'mpd':  # v.0.0.4 modified because of spotifiy
                if NAV_ARRAY_TYPE[NAV_DICT['MARKER']] == 'playlist' and NAV_ARRAY_SERVICE[NAV_DICT['MARKER']] == 'mpd':  # v.0.0.4 modified because of spotifiy
                    SOCKETIO.emit('playPlaylist', {'name': NAV_ARRAY_NAME[NAV_DICT['MARKER']]})
                    reset_variable('player')
                    return
                #elif NAV_ARRAY_TYPE[NAV_DICT['MARKER']] == 'playlist' and NAV_ARRAY_SERVICE[NAV_DICT['MARKER']] == 'spop':  # v.0.0.4 condition added because of spotifiy
                if NAV_ARRAY_TYPE[NAV_DICT['MARKER']] == 'playlist' and NAV_ARRAY_SERVICE[NAV_DICT['MARKER']] == 'spop':  # v.0.0.4 condition added because of spotifiy
                    SOCKETIO.emit('stop')  # v.0.0.4 fix otherwise change from any playing source to spotify dont work
                    sleep(2)  # v.0.0.4 fix otherwise change from any playing source to spotify dont work
                    SOCKETIO.emit('replaceAndPlay', {"service": NAV_ARRAY_SERVICE[NAV_DICT['MARKER']], "type": NAV_ARRAY_TYPE[NAV_DICT['MARKER']], "title": NAV_ARRAY_NAME[NAV_DICT['MARKER']], "uri": NAV_ARRAY_URI[NAV_DICT['MARKER']]})
                    reset_variable('player')
                    return
                #elif 'folder' in NAV_ARRAY_TYPE[NAV_DICT['MARKER']]:
                if 'folder' in NAV_ARRAY_TYPE[NAV_DICT['MARKER']]:
                    if NAV_ARRAY_SERVICE[NAV_DICT['MARKER']] == 'podcast':
                        display_stuff(IMAGE_DICT['BG_DEFAULT'], OBJ_TRANS['DISPLAY']['WAIT'], NAV_DICT['MARKER'], NAV_DICT['LISTSTART'])  # note, please wait
                    browselibrary = True
                #elif 'radio-' in NAV_ARRAY_TYPE[NAV_DICT['MARKER']]:  # the minus (-) is important, otherwise i cant decide between 'radiofolder' and 'webradiostream'
                if 'radio-' in NAV_ARRAY_TYPE[NAV_DICT['MARKER']]:  # the minus (-) is important, otherwise i cant decide between 'radiofolder' and 'webradiostream'
                    browselibrary = True
                #elif 'streaming-' in NAV_ARRAY_TYPE[NAV_DICT['MARKER']]:
                if 'streaming-' in NAV_ARRAY_TYPE[NAV_DICT['MARKER']]:
                    browselibrary = True
                #else:
                    #display_stuff(IMAGE_DICT['BG_DEFAULT'], OBJ_TRANS['DISPLAY']['NOTSUPPORTED'], NAV_DICT['MARKER'], NAV_DICT['LISTSTART'])

            if browselibrary is True:
                # replace "mnt/" in uri through "music-library/", otherwise calling them dont work
                uri = NAV_ARRAY_URI[NAV_DICT['MARKER']]
                uri = uri.replace('mnt/', 'music-library/')
                SOCKETIO.emit('browseLibrary', {'uri': uri})
                browselibrary = False
            else:
                display_stuff(IMAGE_DICT['BG_DEFAULT'], OBJ_TRANS['DISPLAY']['NOTSUPPORTED'], NAV_DICT['MARKER'], NAV_DICT['LISTSTART'])
        else:
            reset_variable('player')
            SOCKETIO.emit('getState')
    #elif mode == 'menu':
    if mode == 'menu':
        if NAV_ARRAY_TYPE[NAV_DICT['MARKER']] == 'emit':
            if 'setSleep' in NAV_ARRAY_URI[NAV_DICT['MARKER']][0]:
                SOCKETIO.emit(NAV_ARRAY_URI[NAV_DICT['MARKER']][0], NAV_ARRAY_URI[NAV_DICT['MARKER']][1])
                display_stuff(IMAGE_DICT['BG_DEFAULT'], OBJ_TRANS['DISPLAY']['SETSLEEPTIMER'], 0, 0, 'info')
                sleep(2)
                DISP.set_backlight(False)
                reset_variable('player')
            else:
                SOCKETIO.emit(NAV_ARRAY_URI[NAV_DICT['MARKER']])
                display_stuff(IMAGE_DICT['BG_DEFAULT'], ['executing:', NAV_ARRAY_URI[NAV_DICT['MARKER']]], 0, 0, 'info')
            return
        #elif NAV_ARRAY_TYPE[NAV_DICT['MARKER']] == 'seek':  # v.0.0.4
        if NAV_ARRAY_TYPE[NAV_DICT['MARKER']] == 'seek':  # v.0.0.4
            VOLUMIO_DICT['MODE'] = 'seek'  # optimieren wg. global bzw. wird das überhaupt benötigt
            display_stuff(IMAGE_DICT['BG_DEFAULT'], OBJ_TRANS['DISPLAY']['SEEK'], 0, 0, 'seek')
            return
        #elif NAV_ARRAY_TYPE[NAV_DICT['MARKER']] == 'prevnext':  # v.0.0.4
        if NAV_ARRAY_TYPE[NAV_DICT['MARKER']] == 'prevnext':  # v.0.0.4
            SOCKETIO.emit('getQueue')  # refresh variables of queue
            VOLUMIO_DICT['MODE'] = 'prevnext'  # optimieren wg. global bzw. wird das überhaupt benötigt
            display_stuff(IMAGE_DICT['BG_DEFAULT'], [''.join([str(VOLUMIO_DICT['POSITION'] + 1), '/', str(LEN_QUEUE)]), OBJ_TRANS['DISPLAY']['PREVNEXT'], TITLE_QUEUE[VOLUMIO_DICT['POSITION']]], 1, 0, 'seek')
            return
        # only get called if no return before was executed
        #else:  # browsesource
        reset_variable('navigation')
        SOCKETIO.emit('getBrowseSources', '')
    #else:
    if mode not in ['player', 'navigation', 'menu']:
        reset_variable('player')
        SOCKETIO.emit('getState')


def button_b(mode, status):  # optimieren, VOLUMIO_DICT['MODE'] durch mode (lokale variable) ersetzen
    #print('button_b, mode:', mode, 'pin:', pin)
    if mode == 'player':
        while not GPIO.input(6) and VOLUMIO_DICT['VOLUME'] > 0:  # limit/exit at volume 0 so amixer dont go crazy
            SOCKETIO.emit('volume', '-')
            sleep(0.5)
    elif mode in ['navigation', 'menu', 'seek', 'prevnext']:
        reset_variable('player')
        IMAGE_DICT['LASTREFRESH'] = time()-5  # to get display refresh independ from refresh thread
        SOCKETIO.emit('getState')


def button_x(mode, status):  # optimieren, VOLUMIO_DICT['MODE'] durch mode (lokale variable) ersetzen
    #print('button_x, mode:', mode, 'pin:', pin)
    if mode == 'player':
        navigation_handler()
        DISP.set_backlight(True)  # v.0.0.4
    elif mode in ['navigation', 'menu']:  # v.0.0.7 hint pylint
        while not GPIO.input(16):
            NAV_DICT['MARKER'] -= 1  # count minus 1
            if NAV_DICT['MARKER'] < 0:  # blaettere nach oben durch
                NAV_DICT['MARKER'] = NAV_DICT['LISTRESULT'] - 1
                if NAV_DICT['LISTRESULT'] > NAV_DICT['LISTMAX'] - 1:  # dann aendere auch noch den liststart
                    NAV_DICT['LISTSTART'] = int(NAV_DICT['LISTSTART'] + (floor(NAV_DICT['LISTRESULT']/NAV_DICT['LISTMAX'])*NAV_DICT['LISTMAX']))
            NAV_DICT['LISTSTART'] = int(floor(NAV_DICT['MARKER']/NAV_DICT['LISTMAX'])*NAV_DICT['LISTMAX'])  # definiert das blaettern zur naechsten Seite
            display_stuff(IMAGE_DICT['BG_DEFAULT'], NAV_ARRAY_NAME, NAV_DICT['MARKER'], NAV_DICT['LISTSTART'])
            sleep(0.1)  # v.0.0.7
    elif mode == 'seek':  # v.0.0.4
        seeking('+')
    elif mode == 'prevnext':  # v.0.0.4
        prevnext('next')


def button_y(mode, status):  # optimieren, VOLUMIO_DICT['MODE'] durch mode (lokale variable) ersetzen
    #print('button_y6, mode:', mode, 'pin:', pin)
    if mode == 'seek':
        seeking('-')
    elif mode == 'prevnext':
        prevnext('prev')
    else:
        while not GPIO.input(BUTTONS[3]):
            if mode == 'player' and VOLUMIO_DICT['VOLUME'] < 100:  # limit/exit at volume 100 so amixer dont go crazy
                SOCKETIO.emit('volume', '+')
                sleep(0.5)
            elif mode in ['navigation', 'menu']:  # v.0.0.7 hint pylint
                NAV_DICT['MARKER'] += 1  # count plus 1
                NAV_DICT['LISTSTART'] = int(floor(NAV_DICT['MARKER']/NAV_DICT['LISTMAX'])*NAV_DICT['LISTMAX'])  # definiert das blaettern zur naechsten Seite
                if NAV_DICT['MARKER'] > NAV_DICT['LISTRESULT'] - 1:  # blaettere nach unten durch
                    NAV_DICT['MARKER'] = 0
                    NAV_DICT['LISTSTART'] = 0
                display_stuff(IMAGE_DICT['BG_DEFAULT'], NAV_ARRAY_NAME, NAV_DICT['MARKER'], NAV_DICT['LISTSTART'])
                sleep(0.1)  # v.0.0.7


def setup_channel(channel):
    """initalise gpio channels"""
    # start_time = time()  # debug, time of code execution
    try:
        print('register %d' % channel)  # v0.0.6
        GPIO.setup(channel, GPIO.IN, GPIO.PUD_UP)
        GPIO.add_event_detect(channel, GPIO.FALLING, handle_button, bouncetime=250)
        print('success')
        sleep(0.1)  # v.0.0.7
    except (ValueError, RuntimeError) as e:
        print('ERROR at setup channel:', e)
    # print("setup_channel--- %s seconds ---" % (time() - start_time))  # debug, time of code execution


for xb in BUTTONS:
    setup_channel(xb)


def main():
    """waits for websocket messages"""
    SOCKETIO.wait()
    sleep(0.5)


def display_refresh():  # v0.0.7
    """processes display refresh for remaing time"""
    #if WS_CONNECTED and VOLUMIO_DICT['SERVICE'] not in ['webradio'] and VOLUMIO_DICT['STATUS'] not in ['stop', 'pause'] and VOLUMIO_DICT['MODE'] == 'player' and time() >= IMAGE_DICT['LASTREFRESH'] + 4.5: # v0.0.7 hint pylint
    if VOLUMIO_DICT['STATE_LAST'] and VOLUMIO_DICT['SERVICE'] not in ['webradio'] and VOLUMIO_DICT['STATUS'] not in ['stop', 'pause'] and VOLUMIO_DICT['MODE'] == 'player' and time() >= IMAGE_DICT['LASTREFRESH'] + 4.5: # v0.0.7 hint pylint
        SOCKETIO.emit('getState')


def display_helper():  # v0.0.7
    """helper function as thread"""
    while True:
        display_refresh()
        sleep(5)


THREAD1 = Thread(target=display_helper)  # v0.0.7
THREAD1.daemon = True  # v0.0.7


try:
    THREAD1.start()  # v0.0.7
    main()
except KeyboardInterrupt:
    clean()
# pass
