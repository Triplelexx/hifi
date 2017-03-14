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
    rotation: MyAvatar.orientation,
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
                    x: 0.2,
                    y: 0.05,
                    z: -0.05
                }, {
                    x: 0.7071067811865476,
                    y: 0.0,
                    z: -0.7071067811865475,
                    w: 0.05
                }],
                LeftHand: [{
                    x: -0.2,
                    y: 0.05,
                    z: -0.05
                }, {
                    x: 0.7071067811865476,
                    y: 0.0,
                    z: 0.7071067811865475,
                    w: 0.0
                }]
            }
        }
    })
};

Entities.addEntity(STICK_PROPERTIES);
Script.stop();
