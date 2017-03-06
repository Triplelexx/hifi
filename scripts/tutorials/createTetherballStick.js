"use strict";

/*jslint nomen: true, vars: true, plusplus: true*/
/*global Entities, Script, Quat, Vec3, Camera, MyAvatar, print*/

// createTetherballStick.js
//
// Created by Triplelexx on 17/03/04
// Copyright 2017 High Fidelity, Inc.
//
// Creates an eqippable stick with a tethered ball
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

var SCRIPT_URL =  Script.resolvePath("./entity_scripts/tetherballStick.js");
var MODEL_URL = "http://hifi-content.s3.amazonaws.com/caitlyn/production/raveStick/newRaveStick2.fbx?v=" + Date.now();
var COLLISION_SOUND_URL = "http://hifi-production.s3.amazonaws.com/tutorials/pistol/drop.wav";
var NULL_UUID = "{00000000-0000-0000-0000-000000000000}";

var avatarOrientation = MyAvatar.orientation;
avatarOrientation = Quat.safeEulerAngles(avatarOrientation);
avatarOrientation.x = 0;
avatarOrientation = Quat.fromVec3Degrees(avatarOrientation);
var startPosition = Vec3.sum(MyAvatar.getHeadPosition(), Vec3.multiply(2, Quat.getFront(avatarOrientation)));

var STICK_PROPERTIES = {
  type: 'Model',
  name: "Tetherball Stick",
  modelURL: MODEL_URL,
  position: startPosition,
  dimensions: {
    x: 0.05,
    y: 0.23,
    z: 0.36
  },
  script: SCRIPT_URL,
  color: {
    red: 200,
    green: 0,
    blue: 20
  },
  shapeType: 'box',
  dynamic: true,
  gravity: {
    x: 0,
    y: -9.8,
    z: 0
  },
  lifetime: 3600,
  restitution: 0,
  damping: 0.5,
  collisionSoundURL: COLLISION_SOUND_URL,
  userData: JSON.stringify({
    userID: MyAvatar.sessionUUID,
    ballID: NULL_UUID,
    actionID: NULL_UUID,
    lineID: NULL_UUID,
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

var stickID = Entities.addEntity(STICK_PROPERTIES);

var ballID = Entities.addEntity({
    type: "Model",
    modelURL: "http://hifi-content.s3.amazonaws.com/Examples%20Content/production/marblecollection/Star.fbx",
    name: "Tetherball",
    shapeType: "Sphere",
    position: startPosition,
    collisionSoundURL: COLLISION_SOUND_URL,
    dimensions: {
        x: 0.2,
        y: 0.2,
        z: 0.2
    },
    gravity: {
        x: 0.0,
        y: -9.8,
        z: 0.0
    },
    damping: 0.3,
    angularDamping: 0.1,
    density: 300,
    restitution: 0.5,
    dynamic: true,
    collidesWith: "static,dynamic,kinematic,otherAvatar,"
});

var lineID = Entities.addEntity({
    type: "PolyLine",
    name: "Tetherball Line",
    color: { red: 250, green: 250, blue: 250 },
    textures: "https://s3-us-west-1.amazonaws.com/hifi-content/clement/production/chess/board_cherry.jpg",
    position: startPosition,
    dimensions: { x: 10, y: 10, z: 10 }
});

// the values set for the action here don't really matter, they'll be overridden on use
var offsetActionID = Entities.addAction("offset", ballID, {
    pointToOffsetFrom: startPosition,
    linearDistance: 0.1,
    linearTimeScale: 0.1
});

// now the other items have been created the references can be added to the userData
var dataProps = Entities.getEntityProperties(stickID);
if (dataProps.userData) {
    try {
        var data = JSON.parse(dataProps.userData);
        data.actionID = offsetActionID;
        data.ballID = ballID;
        data.lineID = lineID;
        Entities.editEntity(stickID, {
            userData: JSON.stringify(data)
        });
    } catch (e) {
    }
}

Script.stop();