# volumio-podcast-plugin
Podcast plugin for Volumio.

You can add or delete podcast RSS feed url at setup configuration in this podcast plugin.

Add podcast
  - at podcast plugin setup configuration, type RSS feed link url.
  - for example, if you want to add NPR's TED Radio Hour Podcast then 
    please type RSS feed url **https://www.npr.org/rss/podcast.php?id=510298**
    
Delete podcast
  - at podcast plugin setup configuration, select podcast item from podcasts list then
    click delete button.
    
Search Podcast
  - You can search podcast keyword and add podcast as a result of searching.
  
Developers Note:
  - There is a problem of using fs-extra package (over version 8)  

## Change log
### version 2.0.0
* search podcast directory with keyword
* add searched result of podcasts
* set search podcast region
* set episodes limit of podcast retrieval
* add podcast favourite function

### version 0.3.0
* add podcast with RSS feed url
* delete podcast
* play podcast episodes with album display