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

(function() {
var SCRIPT_URL = Script.resolvePath("footstepCollider.js") + "?v=" + Date.now();
var CHECK_GENERATORS_INTERVAL_TIME = 5000;
var CHECK_GENERATORS_SEARCH_RADIUS = 2.5;
var footstepLGenerator = undefined;
var footstepRGenerator = undefined;
var checkGeneratorsInterval = undefined;

function createFootstepGenerators() {
    var colliderSize = 0.2 * MyAvatar.scale;
    var footLJointIndex = MyAvatar.getJointIndex("LeftFoot");
    var footLPosition = MyAvatar.getAbsoluteJointTranslationInObjectFrame(footLJointIndex);
    var footLWorldPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, footLPosition));
    var footLOffsetPosition = Vec3.sum(footLWorldPosition, { x: 0.0, y: -colliderSize, z: 0.0 });
    var footRJointIndex = MyAvatar.getJointIndex("RightFoot");
    var footRPosition = MyAvatar.getAbsoluteJointTranslationInObjectFrame(footRJointIndex);
    var footRWorldPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, footRPosition));
    var footROffsetPosition = Vec3.sum(footRWorldPosition, { x: 0.0, y: -colliderSize, z: 0.0 });

    Entities.deleteEntity(footstepLGenerator);
    Entities.deleteEntity(footstepRGenerator);

    footstepLGenerator = Entities.addEntity({
        type: "Sphere",
        name: "footstepLGenerator",
        position: footLOffsetPosition,
        dimensions: {
            x: colliderSize,
            y: colliderSize,
            z: colliderSize
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
        visible: false,
        userData: JSON.stringify({
            grabbableKey: {
                grabbable: false
            }
        })
    });

    footstepRGenerator = Entities.addEntity({
        type: "Sphere",
        name: "footstepRGenerator",
        position: footROffsetPosition,
        dimensions: {
            x: colliderSize,
            y: colliderSize,
            z: colliderSize
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
        visible: false,
        userData: JSON.stringify({
            grabbableKey: {
                grabbable: false
            }
        })
    });
}

function checkFootstepGenerators() {
    Script.clearInterval(checkGeneratorsInterval);
    var foundEntities = Entities.findEntities(MyAvatar.position, CHECK_GENERATORS_SEARCH_RADIUS);
    var searchSuccess = false;
    for (var i = 0; i < foundEntities.length; i++){
        var entityName = Entities.getEntityProperties(foundEntities[i], ["name"]).name;
        if (entityName == "footstepLGenerator") {
            searchSuccess = true;
        }
    }
    if (!searchSuccess) {
        createFootstepGenerators();
    }
    checkGeneratorsInterval = Script.setInterval(checkFootstepGenerators, CHECK_GENERATORS_INTERVAL_TIME);
}
checkGeneratorsInterval = Script.setInterval(checkFootstepGenerators, CHECK_GENERATORS_INTERVAL_TIME);

createFootstepGenerators();

Script.scriptEnding.connect(function() {
    Script.clearInterval(checkGeneratorsInterval);
    Entities.deleteEntity(footstepLGenerator);
    Entities.deleteEntity(footstepRGenerator);
});
}());
