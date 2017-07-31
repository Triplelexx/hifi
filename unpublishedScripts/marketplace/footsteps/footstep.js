"use strict";

//
// footstep.js
//
// Client script that creates two entities that attach to your feet to generate footstep sounds
// 
// Created by Triplelexx on 17/07/27
// Copyright 2017 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
/* eslint indent: ["error", 4, { "outerIIFEBody": 0 }] */

(function() { // BEGIN LOCAL_SCOPE
var SCRIPT_URL = Script.resolvePath("footstepCollider.js") + "?v=" + Date.now();
var footLJointIndex = MyAvatar.getJointIndex("LeftFoot");
var footLPosition = MyAvatar.getAbsoluteJointTranslationInObjectFrame(footLJointIndex);
var footLWorldPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, footLPosition));
var footLOffsetPosition = Vec3.sum(footLWorldPosition, { x: 0.0, y: -0.2, z: 0.0 });
var footRJointIndex = MyAvatar.getJointIndex("RightFoot");
var footRPosition = MyAvatar.getAbsoluteJointTranslationInObjectFrame(footRJointIndex);
var footRWorldPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, footRPosition));
var footROffsetPosition = Vec3.sum(footRWorldPosition, { x: 0.0, y: -0.2, z: 0.0 });

var footstepLGenerator = Entities.addEntity({
    type: "Sphere",
    name: "footstepLGenerator",
    position: footLOffsetPosition, 
    dimensions: {
        x: 0.2,
        y: 0.2,
        z: 0.2
    },
    damping: 1,
    angularDamping: 1,
    parentID: MyAvatar.sessionUUID,
    parentJointIndex: footLJointIndex,
    dynamic: true,
    collisionless: false,
    collidesWith: "static",
    lifetime: -1,
    shapeType: "sphere",
    script: SCRIPT_URL,
    userData: JSON.stringify({
        grabbableKey: {
            grabbable: false
        }
    })
}, false);

var footstepRGenerator = Entities.addEntity({
    type: "Sphere",
    name: "footstepRGenerator",
    position: footROffsetPosition,
    dimensions: {
        x: 0.2,
        y: 0.2,
        z: 0.2
    },
    damping: 1,
    angularDamping: 1,
    parentID: MyAvatar.sessionUUID,
    parentJointIndex: footRJointIndex,
    dynamic: true,
    collisionless: false,
    collidesWith: "static",
    lifetime: -1,
    shapeType: "sphere",
    script: SCRIPT_URL,
    userData: JSON.stringify({
        grabbableKey: {
            grabbable: false
        }
    })
}, false);

Script.scriptEnding.connect(function() {
    Entities.deleteEntity(footstepLGenerator);
    Entities.deleteEntity(footstepRGenerator);
});
}()); // END LOCAL_SCOPE