"use strict";

/*jslint nomen: true, vars: true, plusplus: true*/
/*global Entities, Vec3, MyAvatar, Controller, Camera, Script, print*/

// tetherballStick.js
//
// Created by Triplelexx on 17/03/04
// Copyright 2017 High Fidelity, Inc.
//
// Entity script for an equippable stick with a tethered ball
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

(function() {
    var _this;

    var NULL_UUID = "{00000000-0000-0000-0000-000000000000}";
    var REPOSITION_INTERVAL = 30; // time in ms
    var ENTITY_CHECK_INTERVAL = 5000;
    var LINE_WIDTH = 0.02;
    var BALL_SIZE = 0.175;
    var BALL_DAMPING = 0.3;
    var BALL_ANGULAR_DAMPING = 0.1;
    var BALL_RESTITUTION = 0.4;
    var BALL_DENSITY = 300;
    var ACTION_DISTANCE = 0.5;
    var ACTION_DISTANCE_INCREMENT = 0.005;
    var ACTION_TIMESCALE = 0.01;
    var ACTION_TAG = "tetherballStick Action";
    var BALL_NAME = "tetherballStick Ball";
    var LINE_NAME = "tetherballStick Line";
    var COLLISION_SOUND_URL = "http://public.highfidelity.io/sounds/Footsteps/FootstepW3Left-12db.wav";
    var EQUIP_SOUND_URL = "http://hifi-public.s3.amazonaws.com/sounds/color_busters/powerup.wav";
    var EQUIP_SOUND_VOLUME = 0.2;

    tetherballStick = function() {
        _this = this;
        return;
    };

    tetherballStick.prototype = {
        equipped: false,
        lastReposition: 0,
        lastEntityCheck: 0,
        lineLength: 0,
        userID: NULL_UUID,
        ballID: NULL_UUID,
        lineID: NULL_UUID,
        actionID: NULL_UUID,
        EQUIP_SOUND: undefined,

        preload: function(entityID) {
            this.entityID = entityID;
            this.EQUIP_SOUND = SoundCache.getSound(EQUIP_SOUND_URL);
            Script.update.connect(this.update);
        },

        unload: function() {
            Script.update.disconnect(this.update);
        },

        update: function(dt) {
            // _this during update due to loss of scope
            if (_this.lastCheckForEntity >= ENTITY_CHECK_INTERVAL) {
                _this.checkForEntities();
                _this.lastCheckForEntity = 0;
            } else {
                _this.lastCheckForEntity += dt;
            }

            var isUser = _this.userID == MyAvatar.sessionUUID; // only the user should control the line
            if (_this.equipped && _this.lineLength < ACTION_DISTANCE && isUser) { // increase line after startEquip
                _this.lineLength += ACTION_DISTANCE_INCREMENT;
            } else if (!_this.equipped && _this.lineLength > 0 && isUser) { // reduce lineLength after releaseEquip
                _this.lineLength -= ACTION_DISTANCE_INCREMENT;
            } else if (!_this.equipped && _this.lineLength <= 0 && isUser) {
                _this.deleteLine();
                _this.userID = NULL_UUID;
            }
        },

        checkForEntities: function() {
            if (!this.hasBall()) {
                this.createBall();
            }
            if (!this.hasAction()) {
                this.createAction();
            }
        },

        playEquipSound: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
            var EQUIP_SOUND_OPTIONS = {
                volume: EQUIP_SOUND_VOLUME,
                loop: false,
                position: stickProps.position
            };
            Audio.playSound(this.EQUIP_SOUND, EQUIP_SOUND_OPTIONS);
        },

        startEquip: function(id, params) {
            var hand = params[0];
            Controller.triggerShortHapticPulse(1, hand);
            this.equipped = true;
            this.userID = MyAvatar.sessionUUID;
            this.createLine();
            this.playEquipSound();
        },

        continueEquip: function(id, params) {
            if (!this.equipped || !this.hasRequiredComponents()) {
                return;
            }
            // updating every tick seems excessive, so repositioning is throttled here
            if (Date.now() - this.lastReposition >= REPOSITION_INTERVAL) {
                this.lastReposition = Date.now();
                this.repositionAction();
            }
        },

        releaseEquip: function(id, params) {
            this.equipped = false;
            var stickProps = Entities.getEntityProperties(this.entityID);
            this.playEquipSound();
        },

        createLine: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
            this.lineID = Entities.addEntity({
                type: "PolyLine",
                name: LINE_NAME,
                color: {
                    red: 0,
                    green: 120,
                    blue: 250
                },
                textures: "https://hifi-public.s3.amazonaws.com/alan/Particles/Particle-Sprite-Smoke-1.png",
                position: stickProps.position,
                dimensions: {
                    x: 10,
                    y: 10,
                    z: 10
                }
            });
            this.lineLength = 0;
        },

        deleteLine: function() {
            Entities.deleteEntity(this.lineID);
            this.lineID = NULL_UUID;
        },

        hasLine: function() {
            var lineProps = Entities.getEntityProperties(this.lineID);
            return lineProps.name == LINE_NAME;
        },

        createBall: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
            // don't make a ball if we have an ID
            try {
                var data = JSON.parse(stickProps.userData);
                if (data.ballID != undefined) {
                    return;
                }
            } catch (e) { }
            
            this.ballID = Entities.addEntity({
                type: "Model",
                modelURL: "http://hifi-content.s3.amazonaws.com/Examples%20Content/production/marblecollection/Star.fbx",
                name: BALL_NAME,
                shapeType: "Sphere",
                position: stickProps.position,
                lifetime: 3600,
                collisionSoundURL: COLLISION_SOUND_URL,
                dimensions: {
                    x: BALL_SIZE,
                    y: BALL_SIZE,
                    z: BALL_SIZE
                },
                gravity: {
                    x: 0.0,
                    y: -9.8,
                    z: 0.0
                },
                damping: BALL_DAMPING,
                angularDamping: BALL_ANGULAR_DAMPING,
                density: BALL_DENSITY,
                restitution: BALL_RESTITUTION,
                dynamic: true,
                collidesWith: "static,dynamic,otherAvatar,"
            });

            // add reference to userData
            try {
                var stickData = JSON.parse(stickProps.userData);
                stickData.ballID = this.ballID;
                Entities.editEntity(stickID, {
                    userData: JSON.stringify(stickData)
                });
            } catch (e) {}
        },

        hasBall: function() {
            var ballProps = Entities.getEntityProperties(this.ballID);
            return ballProps.name == BALL_NAME;
        },

        createAction: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);
            // don't make an action if we have an ID
            try {
                var data = JSON.parse(stickProps.userData);
                if (data.actionID != actionID) {
                    return;
                }
            } catch (e) { }
            
            var actionID = Entities.addAction("offset", this.ballID, {
                pointToOffsetFrom: stickProps.position,
                linearDistance: 0,
                tag: ACTION_TAG,
                linearTimeScale: ACTION_TIMESCALE
            });

            // add reference to userData
            try {
                var stickData = JSON.parse(stickProps.userData);
                stickData.actionID = this.actionID;
                Entities.editEntity(stickID, {
                    userData: JSON.stringify(stickData)
                });
            } catch (e) {}
        },

        hasAction: function() {
            var actionProps = Entities.getActionArguments(this.ballID, this.actionID);
            return actionProps.tag == ACTION_TAG;
        },

        hasRequiredComponents: function() {
            return this.hasBall() && this.hasAction() && this.hasLine();
        },

        repositionAction: function() {
            var stickProps = Entities.getEntityProperties(this.entityID);

            Entities.updateAction(this.ballID, this.actionID, {
                pointToOffsetFrom: stickProps.position,
                linearDistance: this.lineLength,
                linearTimeScale: ACTION_TIMESCALE
            });

            var ballProps = Entities.getEntityProperties(this.ballID);
            var linePoints = [];
            var normals = [];
            var strokeWidths = [];
            linePoints.push(Vec3.ZERO);
            normals.push(Vec3.multiplyQbyV(Camera.getOrientation(), Vec3.UNIT_NEG_Z));
            strokeWidths.push(LINE_WIDTH);
            linePoints.push(Vec3.subtract(ballProps.position, stickProps.position));
            normals.push(Vec3.multiplyQbyV(Camera.getOrientation(), Vec3.UNIT_NEG_Z));
            strokeWidths.push(LINE_WIDTH);

            var lineProps = Entities.getEntityProperties(this.lineID);
            Entities.editEntity(this.lineID, {
                linePoints: linePoints,
                normals: normals,
                strokeWidths: strokeWidths,
                position: stickProps.position,
                lifetime: Math.round(lineProps.age + 2)
            });
        }
    };

    // entity scripts should return a newly constructed object of our type
    return new tetherballStick();
});
