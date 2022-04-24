# nodegistry
Docker Registry Remote API module.

## Example
Get the manifest of an image stored on a private registry.
```javascript
const Registry = require('nodegistry');

let registry = new Registry({
  credentials: {
    user: 'yourUsername',
    pass: 'yourPassword'
  },
  url: 'https://repository.yourcompany.com/v2',
});

let manifest = await registry.getRepository('mariadb').getManifest('10');
console.log(manifest._body);

```
