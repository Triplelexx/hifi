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
    var COLLISION_COOLDOWN_TIME = 750;
    var footstepLSoundFiles = ["FootstepW2Left-12db.wav", "FootstepW3Left-12db.wav", "FootstepW5Left-12db.wav"];
    var footstepRSoundFiles = ["FootstepW2Right-12db.wav", "FootstepW3Right-12db.wav", "FootstepW5Right-12db.wav"];

    var _this;

    function FootStepCollider() {
        _this = this;
        return;
    }

    FootStepCollider.prototype = {
        footstepAudioInjector: undefined,
        footstepSounds: [],
        avatarScale: 1,
        timeSinceLastCollision: 0,
        preload: function(entityID) {
            if (MyAvatar.sessionUUID != Entities.getEntityProperties(entityID, ["parentID"]).parentID) {
                return;
            }
            this.entityID = entityID;
            this.timeSinceLastCollision = Date.now();
            this.avatarScale = MyAvatar.scale;
        },
        collisionWithEntity: function(myEntityID, collidingEntityID, collisionInfo) {
            if (MyAvatar.sessionUUID != Entities.getEntityProperties(this.entityID, ["parentID"]).parentID) {
                return;
            }
            if (!(Date.now() - this.timeSinceLastCollision > COLLISION_COOLDOWN_TIME)) {
                return;
            }
            if (collisionInfo.type == 0) {
                this.checkCustomFootsteps(collidingEntityID);
                this.checkAvatarScaleChanged();
            }
            if (this.footstepAudioInjector !== undefined && this.footstepAudioInjector.isPlaying()) {
                this.footstepAudioInjector.stop();
            }
            var randomSoundIndex = randInt(0, this.footstepSounds.length);
            if (collisionInfo.type == 0 || collisionInfo.type == 1 && Vec3.length(MyAvatar.velocity) >= 0.5) {
                if (this.footstepSounds[randomSoundIndex].downloaded) {
                    this.footstepAudioInjector = Audio.playSound(this.footstepSounds[randomSoundIndex], {
                        position: MyAvatar.position,
                        volume: clamp((MyAvatar.scale / 7.5) * Vec3.length(MyAvatar.velocity), 0.05, 1),
                        loop: false
                    });
                }
                this.timeSinceLastCollision = Date.now();
            }
        },
        checkCustomFootsteps: function(collidingEntityID) {
            var footstepEntityName = Entities.getEntityProperties(this.entityID, ["name"]).name;
            this.footstepSounds = [];
            if (footstepEntityName == "footstepLGenerator") {
                var customFootstepLSoundFiles = getEntityCustomData("footstepLSoundFiles", collidingEntityID, undefined);
                if (customFootstepLSoundFiles !== undefined) {
                    if (customFootstepLSoundFiles.length == 0) {
                        return;
                    }
                    for (var i = 0; i < customFootstepLSoundFiles.length; i++) {
                        this.footstepSounds.push(SoundCache.getSound(customFootstepLSoundFiles[i]));
                    }
                } else {
                    for (var i = 0; i < footstepLSoundFiles.length; i++) {
                        this.footstepSounds.push(SoundCache.getSound(FOOTSTEP_BASE_URL + footstepLSoundFiles[i]));
                    }
                }
            } else {
                var customFootstepRSoundFiles = getEntityCustomData("footstepRSoundFiles", collidingEntityID, undefined);
                if (customFootstepRSoundFiles !== undefined) {
                    if (customFootstepRSoundFiles.length == 0) {
                        return;
                    }
                    for (var i = 0; i < customFootstepRSoundFiles.length; i++) {
                        this.footstepSounds.push(SoundCache.getSound(customFootstepRSoundFiles[i]));
                    }
                } else {
                    for (var i = 0; i < footstepRSoundFiles.length; i++) {
                        this.footstepSounds.push(SoundCache.getSound(FOOTSTEP_BASE_URL + footstepRSoundFiles[i]));
                    }
                }
            }
        },
        checkAvatarScaleChanged: function() {
            if (this.avatarScale == MyAvatar.scale) {
                return;
            }
            var footstepEntityName = Entities.getEntityProperties(this.entityID, ["name"]).name;
            var footJointIndex = 0;
            if (footstepEntityName == "footstepLGenerator") {
                footJointIndex = MyAvatar.getJointIndex("LeftFoot");
            } else {
                footJointIndex = MyAvatar.getJointIndex("RightFoot");
            }
            var colliderSize = 0.2 * MyAvatar.scale;
            var footPosition = MyAvatar.getAbsoluteJointTranslationInObjectFrame(footJointIndex);
            var footWorldPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, footPosition));
            var footOffsetPosition = Vec3.sum(footWorldPosition, { x: 0.0, y: -colliderSize, z: 0.0 });
            Entities.editEntity(this.entityID, {
                position: footOffsetPosition,
                dimensions: {
                    x: colliderSize,
                    y: colliderSize,
                    z: colliderSize
                }
            });
            this.avatarScale = MyAvatar.scale;
        }
    };
    return new FootStepCollider();
});
