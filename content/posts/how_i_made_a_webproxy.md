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
import fetch from 'node-fetch';
import express from 'express';

const publicPath = "public";
const port = 3000;

const blockList = ["https://www.google.com"]; // Sites in here will return 500
const jsInjection = `console.log('native');`; // Injects this into page

const app = express();
app.use(express.static(publicPath));

const handleResponse = async (response, res) => {
    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType);

    if (contentType && contentType.startsWith('text')) {
        const data = await response.text();
        const rewritten = data + `<script src="/native.js"></script>` + `<script>${jsInjection}</script>`; // Element Rewriting + JS Injection

        res.send(rewritten);

    } else {
        const data = await response.arrayBuffer();
        const buffer = Buffer.from(data);

        res.send(buffer);
    }
}

app.get('/url/*', async (req, res) => {
    const URL = req.params[0];
    if (blockList.includes(URL)) {
        res.status(500).send('Blocked URL');
        return;
    } // Block URLs

    try {
        const response = await fetch(URL);
        await handleResponse(response, res);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching URL');
    }
});

app.listen(port, () => { 
    console.log(`Server is running on port: ${port}`); 
});
```

`contentType` is used for controlling how the content is being served.\
Things like HTML, CSS, etc. use `Content-Type text/*something*` and are returned as text.\
Meanwhile images use `Content-Type image/*something*` and return buffers.

```js
    if (blockList.includes(URL)) {
        res.status(500).send('Blocked URL');
        return;
    } // Block URLs
```
This is used to block URLs


```js
const rewritten = data + `<script src="/native.js"></script>` + `<script>${jsInjection}</script>`; // Element Rewriting + JS Injection
```
This is used to inject the client/rewriter inside the page as well as injecting custom JS inside the page.\
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
function rewrite(element, proxyUrl) {
    const attributes = ['href', 'src']; // Rewrite these attr's

    attributes.forEach(attr => {
        const attrValue = element.getAttribute(attr);

        if (attrValue && !attrValue.includes('native.js')) { // Don't rewrite the rewritier
            const url = new URL(attrValue, proxyUrl);
            element.setAttribute(attr, `${window.location.origin}/url/${url}`);
        }
    });

    if (element.hasAttribute('integrity')) {
        element.removeAttribute('integrity'); // kys
    }
}

function getUrl() {
    return window.location.pathname.split('/url/').pop(); // Grab URL
};

const proxyUrl = getUrl();

const elements = document.querySelectorAll('[href], [src]');
elements.forEach(element => rewrite(element, proxyUrl));
```


It will rewrite the attributes `src` and `href`

It also has extra code to fix some issues like the `integrity` API, making sure all pages get re-written correctly, etc.

## Tada
Thats a simple Webproxy that does HTML and CSS rewriting :D\
I hope you learned something!