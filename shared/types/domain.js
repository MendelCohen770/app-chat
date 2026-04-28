"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.Role = void 0;
var Role;
(function (Role) {
    Role[Role["admin"] = 0] = "admin";
    Role[Role["user"] = 1] = "user";
})(Role || (exports.Role = Role = {}));
var MessageType;
(function (MessageType) {
    MessageType["text"] = "text";
    MessageType["image"] = "image";
    MessageType["video"] = "video";
    MessageType["audio"] = "audio";
    MessageType["file"] = "file";
})(MessageType || (exports.MessageType = MessageType = {}));
//# sourceMappingURL=domain.js.map