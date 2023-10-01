import queue
import threading
from includes import menu_manager, controls, volumio
import logging

logger = logging.getLogger("Teac DAB controls")
logger.setLevel(logging.WARNING)
logging.basicConfig()

controlQ = queue.Queue()
volumioQ = queue.Queue()
menuManagerQ = queue.Queue()

t1 = threading.Thread(target=controls.controls, args=(controlQ,))
t2 = threading.Thread(target=menu_manager.menu_manager, args=(controlQ, volumioQ, menuManagerQ, ))
t3 = threading.Thread(target=volumio.volumio, args=(volumioQ, menuManagerQ,))

t1.start()
t2.start()
t3.start()

controlQ.join()
volumioQ.join()
