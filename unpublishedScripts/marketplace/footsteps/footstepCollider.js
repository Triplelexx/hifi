"use strict";

//
// footstepCollider.js
//
// Client entity script that triggers a set of default footstep sounds when walking.
// The script detects if custom data has been configured on an entity to allow modification.
// 
// Created by Triplelexx on 17/07/27
// Copyright 2017 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
/* eslint indent: ["error", 4, { "outerIIFEBody": 0 }] */

(function() {

    Script.include("/~/system/libraries/utils.js");

    var HIFI_PUBLIC_BUCKET = "http://s3.amazonaws.com/hifi-public/";
    var FOOTSTEP_BASE_URL = HIFI_PUBLIC_BUCKET + "sounds/Footsteps/";
    var COLLISION_COOLDOWN_TIME = 500;
    var footstepLFilenames = ["FootstepW2Left-12db.wav", "FootstepW3Left-12db.wav", "FootstepW5Left-12db.wav"];
    var footstepRFilenames = ["FootstepW2Right-12db.wav", "FootstepW3Right-12db.wav", "FootstepW5Right-12db.wav"];

    var _this;

    function FootStepCollider() {
        _this = this;
        return;
    }

    FootStepCollider.prototype = {
        footstepAudioInjector: undefined,
        footstepSounds: [],
        timeSinceLastCollision: 0,
        preload: function(entityID) {
            this.entityID = entityID;
            logWarn(Entities.getEntityProperties(this.entityID, ["parentID"]).parentID);
            if (MyAvatar.sessionUUID != Entities.getEntityProperties(this.entityID, ["parentID"]).parentID){
                return;
            }
            logWarn("starting");
            this.timeSinceLastCollision = Date.now();
            var footstepEntityName = Entities.getEntityProperties(this.entityID, ["name"]).name;
            if (footstepEntityName == "footstepLGenerator") {
                for (var i = 0; i < footstepLFilenames.length; i++) {
                    this.footstepSounds.push(SoundCache.getSound(FOOTSTEP_BASE_URL + footstepLFilenames[i]));
                }
            } else {
                for (var i = 0; i < footstepRFilenames.length; i++) {
                    this.footstepSounds.push(SoundCache.getSound(FOOTSTEP_BASE_URL + footstepRFilenames[i]));
                }
            }
        },
        unload: function() {
        },
        collisionWithEntity: function(myEntityID, collidingEntityID, collisionInfo) {
            if (MyAvatar.sessionUUID != Entities.getEntityProperties(this.entityID, ["parentID"]).parentID){
                return;
            }
            if (!(Date.now() - this.timeSinceLastCollision > COLLISION_COOLDOWN_TIME)) {
                return;
            }
            if (this.footstepAudioInjector !== undefined && this.footstepAudioInjector.isPlaying()) {
                 this.footstepAudioInjector.stop();
            }
            if (collisionInfo.type == 0 || collisionInfo.type == 1 && Vec3.length(MyAvatar.velocity) >= 0.5) {
                if (this.footstepSounds[0].downloaded) {
                    this.footstepAudioInjector = Audio.playSound(this.footstepSounds[0], {
                        position: MyAvatar.position,
                        volume: 1.0,
                        loop: false
                    });
                }
                this.timeSinceLastCollision = Date.now();
            }
        }
    };
    return new FootStepCollider();
});