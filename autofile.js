/*jshint es5:true*/

'use strict';

var plist = require('plist');
var fs    = require('fs');

function plistFilename(app) {
    return app + '/Contents/Info.plist';
}

function inspect(obj, depth) {
    depth = depth || 10;

    console.log(require('util').inspect(obj, {
        showHidden: true,
        depth: depth,
        colors: true
    }));
}

function findKeyHolder(obj, key) {
    // console.log('testing', key);
    var attempt;

    if (obj instanceof Object) {
        for (var k in obj) {
            if (k === key) {
                return obj;
            } else {
                attempt = findKeyHolder(obj[k], key);

                if (attempt) {
                    return attempt;
                }
            }
        }
    }

    return false;
}

module.exports = function (task) {
    task
    .id('autofile')
    .name('autofile')
    .author('Task author')
    .description('Pack an .app with custom settings. More info on the options in https://developer.apple.com/library/ios/documentation/general/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html')

    .option('app', 'The .app file you want to customize')
    .option('CFBundleDisplayName', 'Bundle display name')
    // .option('CFBundleTypeName', '', '')
    // .option('CFBundleExecutable', 'Name of the bundle’s executable file')
    .option('CFBundleName', 'The short display name of the bundle')
    .option('CFBundleShortVersionString', 'The release-version-number string for the bundle')
    .option('CFBundleVersion', 'The build-version-number string for the bundle')
    .option('LSMinimumSystemVersion', 'LSMinimumSystemVersion', '10.6.0') // info can be found in https://developer.apple.com/library/ios/documentation/general/Reference/InfoPlistKeyReference/Articles/LaunchServicesKeys.html
    // .option('UTTypeDescription', 'A user-readable description of this type', '') // info can be found in https://developer.apple.com/library/mac/DOCUMENTATION/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html
    .option('UTTypeIconFile', 'The name of the bundle icon resource to associate with this UTI.')
    .option('CFBundleTypeIconFile', 'This key contains a string with the name of the icon file (.icns) to associate with this OS X document type. ')
    .option('CFBundleIconFile', 'A legacy way to specify the app’s icon')
    .option('UTTypeReferenceURL', 'The URL for a reference document that describes this type.')

    .setup(function (opts, ctx, next) {
        // group plist keys into its own object
        var keys = [
            'CFBundleDisplayName',
            'CFBundleName',
            'CFBundleShortVersionString',
            'CFBundleVersion',
            'LSMinimumSystemVersion',
            'UTTypeIconFile',
            'CFBundleTypeIconFile',
            'CFBundleIconFile',
            'UTTypeReferenceURL'
        ];

        opts.keyValues = {};
        keys.forEach(function (key) {
            opts.keyValues[key] = opts[key];
        });

        next();
    })

    // Read the plist
    .do(function (opts, ctx, next) {
        opts.infoPlist = plist.parseFileSync(plistFilename(opts.app));

        next();
    }, {
        description: 'Read {{app}} Info.plist file'
    })

    // Apply properties
    .do(function (opts, ctx, next) {
        var keyValues  = opts.keyValues;
        var plist = opts.infoPlist;
        var propertyHolder;
// inspect(plist);
        for (var k in opts.keyValues) {
            propertyHolder = findKeyHolder(plist, k);

            if (propertyHolder) {
                console.log('found key:', k);
                propertyHolder[k] = keyValues[k];
            }
        }

        next();
    }, {
        description: 'Apply properties'
    })

    // save file
    .do(function (opts, ctx, next) {
        var plistStr = plist.build(opts.infoPlist).toString();

        ctx.log.debugln(plistStr);

        fs.writeFile(plistFilename(opts.app), plistStr, function (err) {
            next(err);
        });
    }, {
        description: 'Save Info.plist file'
    });
};