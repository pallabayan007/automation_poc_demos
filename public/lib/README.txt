This folder contains all libraries used in WEB Portal. 

1. ALL front-end JS libraries MUST place here
2. DO NOT use CDN libraries: ajax.google, cloudflare
3. Please Keep Sync with bower.json in ROOT directory
4. Please also update Gruntfile.js in ROOT directory, JS file should be minified before production.
5. Update the ChangeLog whenever change the directory

ChangeLog

20150625
Added angular-file-upload(es5-shim as dependencies)
	- https://github.com/nervgh/angular-file-upload
	- Licensed MIT
Added ng-file-upload
	- https://github.com/danialfarid/ng-file-upload
	- Licensed MIT


--------------------------------------------------------------------
20150624 (- initialize)
Remove JQueryUI-New
Remove JQueryUI-bootstrap
Added textAngular - 1.1.2
	- http://textangular.com/
	- Licensed MIT
Added angular-sanitize - 1.4.1
	- https://github.com/angular/bower-angular-sanitize
	- Licensed MIT
Added angular-route -1.4.1
	- http://angularjs.org
	- License MIT

TODO: 1. Remove all googleapi dependencies
	  2. Minify JS library in GruntJS file
	  3. Remove all dependencies in SOP editor