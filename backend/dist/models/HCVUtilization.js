"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HCVUtilization = exports.VoucherType = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
var VoucherType;
(function (VoucherType) {
    VoucherType["TENANT_BASED"] = "tenant_based";
    VoucherType["PROJECT_BASED"] = "project_based";
    VoucherType["HOMEOWNERSHIP"] = "homeownership";
    VoucherType["EMERGENCY_HOUSING"] = "emergency_housing";
    VoucherType["HUD_VASH"] = "hud_vash";
    VoucherType["PERMANENT_SUPPORTIVE"] = "permanent_supportive";
    VoucherType["MAINSTREAM"] = "mainstream";
    VoucherType["SPECIAL_PURPOSE"] = "special_purpose";
    VoucherType["MTW_FLEXIBLE"] = "mtw_flexible";
    VoucherType["OTHER"] = "other";
})(VoucherType || (exports.VoucherType = VoucherType = {}));
let HCVUtilization = class HCVUtilization {
};
exports.HCVUtilization = HCVUtilization;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], HCVUtilization.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reporting date is required' }),
    (0, class_validator_1.IsDate)({ message: 'Reporting date must be a valid date' }),
    __metadata("design:type", Date)
], HCVUtilization.prototype, "reportingDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: VoucherType
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Voucher type is required' }),
    __metadata("design:type", String)
], HCVUtilization.prototype, "voucherType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Authorized vouchers is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Authorized vouchers must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Authorized vouchers must be a positive number' }),
    __metadata("design:type", Number)
], HCVUtilization.prototype, "authorizedVouchers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Leased vouchers is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Leased vouchers must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Leased vouchers must be a positive number' }),
    __metadata("design:type", Number)
], HCVUtilization.prototype, "leasedVouchers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Utilization rate is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Utilization rate must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Utilization rate must be a positive number' }),
    __metadata("design:type", Number)
], HCVUtilization.prototype, "utilizationRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'HAP expenses is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'HAP expenses must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'HAP expenses must be a positive number' }),
    __metadata("design:type", Number)
], HCVUtilization.prototype, "hapExpenses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, nullable: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'Average HAP per unit must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Average HAP per unit must be a positive number' }),
    __metadata("design:type", Number)
], HCVUtilization.prototype, "averageHapPerUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'Budget utilization must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Budget utilization must be a positive number' }),
    __metadata("design:type", Number)
], HCVUtilization.prototype, "budgetUtilization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], HCVUtilization.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HCVUtilization.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HCVUtilization.prototype, "updatedAt", void 0);
exports.HCVUtilization = HCVUtilization = __decorate([
    (0, typeorm_1.Entity)('hcv_utilization')
], HCVUtilization);
