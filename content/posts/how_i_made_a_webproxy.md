---
title: How I made a basic Webproxy
date: 2024-05-10 10:29:30
tags: ["webproxy", "web-development"]
---


# How I made a basic Webproxy
I wanted to document how I made a very simple Webproxy for anyone whos interested in this kind of stuff


First of all this not something like [Ultraviolet](https://github.com/titaniumnetwork-dev/ultraviolet).\
[Ultraviolet](https://github.com/titaniumnetwork-dev/ultraviolet) uses [TompHTTP](https://github.com/tomphttp), uses [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), and does JavaScript rewriting.


Frankly, all of that stuff is too complicated for me.


So instead I wanted to create a basic Webproxy that only does HTML and CSS rewriting.\
This means only static sites will work.


## How I made it
There are two parts, the server and the client.


### Server
The server is simple.\
It uses [ExpressJS](https://expressjs.com) and [node-fetch](https://www.npmjs.com/package/node-fetch).


[ExpressJS](https://expressjs.com) is used for:
- Serving the client
- Creating the API for [node-fetch](https://www.npmjs.com/package/node-fetch)
- And controlling headers.


[node-fetch](https://www.npmjs.com/package/node-fetch) is used for proxying the request to the website


This is the server code:
```js
app.get('/url/*', async (req, res) => {
  const URL = decodeURIComponent(req.params[0]);
  try {
    const response = await fetch(URL);
    const contentType = response.headers.get('content-type');


    if (contentType && contentType.startsWith('text')) {
      const data = await response.text();
      const rewritten = data + `<script src="/native.js"></script>`; // Element Rewriting
      res.setHeader('Content-Type', contentType);
      res.send(rewritten);


    } else { // Images
      const data = await response.arrayBuffer();
      const buffer = Buffer.from(data);
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    }


  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching URL');
  }
});
```


`contentType` is used for controlling how the content is being served.\
Things like HTML, CSS, etc. use `Content-Type text/*something*` and are returned as text.\
Meanwhile images use `Content-Type image/*something*` and return buffers.


```js
const rewritten = data + `<script src="/native.js"></script>`; // Element Rewriting
```
This is used to inject the client/rewriter inside the page.\
This gives us the benefit of being able to use APIs like `document` to control the page, compared to using an HTML parser like [parse5](https://www.npmjs.com/package/parse5)


### Client
The client is also simple.


It checks all elements for `href` and `src` attributes and rewrites them to be `sandboxed`.


For example
```html
<link rel="stylesheet" href="styles.css">
```
Will be rewritten as
```html
<link rel="stylesheet" href="localhost:3000/url/*URL*/style.css">
```


The clients code is:
```js
function rewrite(element) {
    const href = element.getAttribute('href');
    const src = element.getAttribute('src');


    if (src && src.includes('native.js')) {
        return; // lmao
    }
   
    if (href) {
        if (!href.startsWith('http')) {
            element.setAttribute('href', `${window.location.href}${encodeURIComponent(href)}`);
        } else {
            element.setAttribute('href', `${window.location.origin}/url/${encodeURIComponent(href)}`);
        }
    }
   
    if (src) {
        if (!src.startsWith('http')) {
            element.setAttribute('src', `${window.location.href}${encodeURIComponent(src)}`);
        } else {
            element.setAttribute('src', `${window.location.origin}/url/${encodeURIComponent(src)}`);
        }
    }


    if (element.hasAttribute('integrity')) {
        element.removeAttribute('integrity'); // wtf is this
    }
}


const elements = document.querySelectorAll('[href], [src]');
elements.forEach(rewrite);


const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
                rewrite(node);
            }
        });
    });
});


observer.observe(document.body, { childList: true, subtree: true });
```


Attributes that start with `http` (links) are treated differently as links would be break.\
So they use `${window.location.origin}/url/` instead of `${window.location.href}`


A mutation observer is used to make sure all elements are `sandboxed`.

## Tada
Thats a simple Webproxy that does HTML and CSS rewriting :D\
I hope you learned something!