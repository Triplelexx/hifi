"use strict";

/*jslint nomen: true, vars: true, plusplus: true*/
/*global Entities, Script, Quat, Vec3, Camera, MyAvatar, print*/

// createTetherballStick.js
//
// Created by Triplelexx on 17/03/04
// Copyright 2017 High Fidelity, Inc.
//
// Creates an equippable stick with a tethered ball
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

var STICK_SCRIPT_URL = Script.resolvePath("./entity_scripts/tetherballStick.js?v=" + Date.now());
var STICK_MODEL_URL = "http://hifi-content.s3.amazonaws.com/caitlyn/production/raveStick/newRaveStick2.fbx";

var avatarOrientation = MyAvatar.orientation;
avatarOrientation = Quat.safeEulerAngles(avatarOrientation);
avatarOrientation.x = 0;
avatarOrientation = Quat.fromVec3Degrees(avatarOrientation);
var startPosition = Vec3.sum(MyAvatar.getRightPalmPosition(), Vec3.multiply(1, Quat.getFront(avatarOrientation)));

var STICK_PROPERTIES = {
    type: 'Model',
    name: "tetherballStick Stick",
    modelURL: STICK_MODEL_URL,
    position: startPosition,
    rotation: Quat.fromPitchYawRollDegrees(0.0, -90.0, 0.0),
    dimensions: {
        x: 0.0651,
        y: 0.0651,
        z: 0.5270
    },
    script: STICK_SCRIPT_URL,
    color: {
        red: 200,
        green: 0,
        blue: 20
    },
    shapeType: 'box',
    dynamic: false,
    lifetime: 3600,
    userData: JSON.stringify({
        grabbableKey: {
            invertSolidWhileHeld: true
        },
        wearable: {
            joints: {
                RightHand: [{
                    x: 0.07079616189002991,
                    y: 0.20177987217903137,
                    z: 0.06374628841876984
                }, {
                    x: -0.5863648653030396,
                    y: -0.46007341146469116,
                    z: 0.46949487924575806,
                    w: -0.4733745753765106
                }],
                LeftHand: [{
                    x: 0.1802254319190979,
                    y: 0.13442856073379517,
                    z: 0.08504903316497803
                }, {
                    x: 0.2198076844215393,
                    y: -0.7377811074256897,
                    z: 0.2780133783817291,
                    w: 0.574519157409668
                }]
            }
        }
    })
};

Entities.addEntity(STICK_PROPERTIES);
Script.stop();
