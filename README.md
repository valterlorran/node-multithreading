# node-multithreading

## Installation

```
$ npm install node-multithreading --save
```

## Setup
```js
import NodeMultithreading from 'node-multithreading';

NodeMultithreading(()=>{
    // run your app
}, {
    /* Optional */
    isClusterActive: true,
    log: false,
    masterPort: 3000
})
```

## Example

```js
import NodeMultithreading from 'node-multithreading';
import express from "express";
import http from 'http';

NodeMultithreading(()=>{
    // run your app
    const app = express()
	const server = http.Server(app);

    server.listen(0, '0.0.0.0');
    
	app.get('/', (req:any, res:any) => {
		res.send('Hello World!')
    });

	return server;
}, {
    /* Optional */
    isClusterActive: true
})
```

## Note
1) The server must be running on port 0, so the master server can communicate with the slaves.

    ```js
    server.listen(0, '0.0.0.0');
    ```
2) You must return the server, otherwise the master won't be able to proxy to the children.
    ```js
	return server;
    ```
