"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_controller_1 = require("../controllers/upload.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.verifyToken);
// Upload file
router.post('/', upload_controller_1.upload.single('file'), upload_controller_1.handleFileUpload);
// Get all style templates
router.get('/style-templates', upload_controller_1.getStyleTemplates);
// Delete a style template
router.delete('/style-templates/:id', upload_controller_1.deleteStyleTemplate);
exports.default = router;
