Linked Jazz Network
===================

The source for [linkedjazz.org/network](http://www.linkedjazz.org/network)


This is a d3.js network visualization powered by linked data. 
The data directory contains the triple files that populate the graph via RDF plugin for jquery. No database is required.



---

Analytics
====

To set analytics, replace the analytics.php file in the root of the project. This file should contain your analytics embed (with default pageviews disabled) and a JavaScript block which listens for 'vpv' events and manually triggers pageviews for your analytics system.


```
<?php // analytics.php ?>

<script>
  $('body').on('vpv', function() {
    // manually fire a pageview
  });
</script>
```



---

License
====
The MIT License (MIT)

Copyright (c) 2014 Matt Miller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---
* This project utilizes libraries which may or may not have additional individual licenses
