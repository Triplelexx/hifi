"use strict";

//
// createFootstepTestSurface.js
//
// Client script that creates a test surface with footstep sound data
//
// Test sounds sourced from freesound.org, courtesy of soundscalpel.com
// Edited to be 500% faster
// License: Attribution 3.0 Unported (CC BY 3.0)
// http://freesound.org/people/soundscalpel.com/sounds/110619/
// http://freesound.org/people/soundscalpel.com/sounds/110609/
// http://freesound.org/people/soundscalpel.com/sounds/110620/
//
// Created by Triplelexx on 17/08/01
// Copyright 2017 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

(function() {
    var BASE_URL = "http://mpassets.highfidelity.com/47115e53-6eab-4317-af78-8c6b4c470c0e-v1/";
    var snowyFootstepSound1 = BASE_URL + "snow1.wav";
    var snowyFootstepSound2 = BASE_URL + "snow3.wav";
    var snowyFootstepSound3 = BASE_URL + "snow3.wav";
    var snowyFootstepSounds = [snowyFootstepSound1, snowyFootstepSound2, snowyFootstepSound3];
    var startPosition = Vec3.sum(Vec3.sum(MyAvatar.position, {
        x: 0,
        y: 3 * MyAvatar.scale,
        z: 0
    }), Vec3.multiply(10, Quat.getForward(Camera.getOrientation())));

    var testSurface = Entities.addEntity({
        type: "Box",
        name: "Snowy Test Surface",
        position: startPosition,
        dimensions: {
            x: 10,
            y: 0.1,
            z: 10
        },
        lifetime: -1,
        shapeType: "Box",
        userData: JSON.stringify({
            grabbableKey: {
                grabbable: false
            },
            footstepLSoundFiles: snowyFootstepSounds,
            footstepRSoundFiles: snowyFootstepSounds
        })
    });

    Script.scriptEnding.connect(function() {
        Entities.deleteEntity(testSurface);
    });
}());
