"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const import_controller_1 = require("../controllers/import.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const fileUpload_1 = require("../utils/fileUpload");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.verifyToken);
// Upload file route (admin/user only)
router.post('/upload', auth_middleware_1.isUser, fileUpload_1.upload.single('file'), import_controller_1.uploadFile);
// Download template route
router.get('/template/:templateType', [
    (0, express_validator_1.param)('templateType')
        .isIn(['budget', 'reserves', 'expenditures', 'commitments'])
        .withMessage('Invalid template type')
], import_controller_1.downloadTemplate);
exports.default = router;
