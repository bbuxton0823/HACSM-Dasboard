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
exports.Commitment = exports.CommitmentStatus = exports.CommitmentType = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
var CommitmentType;
(function (CommitmentType) {
    CommitmentType["TRADITIONAL_HAP"] = "traditional_hap";
    CommitmentType["PUBLIC_HOUSING"] = "public_housing";
    CommitmentType["CAPITAL_FUND"] = "capital_fund";
    CommitmentType["LOCAL_NON_TRADITIONAL"] = "local_non_traditional";
    CommitmentType["HCV_ADMIN"] = "hcv_admin";
    CommitmentType["OTHER"] = "other";
})(CommitmentType || (exports.CommitmentType = CommitmentType = {}));
var CommitmentStatus;
(function (CommitmentStatus) {
    CommitmentStatus["PLANNED"] = "planned";
    CommitmentStatus["COMMITTED"] = "committed";
    CommitmentStatus["OBLIGATED"] = "obligated";
    CommitmentStatus["PARTIALLY_EXPENDED"] = "partially_expended";
    CommitmentStatus["FULLY_EXPENDED"] = "fully_expended";
    CommitmentStatus["CANCELLED"] = "cancelled";
})(CommitmentStatus || (exports.CommitmentStatus = CommitmentStatus = {}));
let Commitment = class Commitment {
};
exports.Commitment = Commitment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Commitment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Commitment number is required' }),
    __metadata("design:type", String)
], Commitment.prototype, "commitmentNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Activity description is required' }),
    __metadata("design:type", String)
], Commitment.prototype, "activityDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CommitmentType
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Commitment type is required' }),
    __metadata("design:type", String)
], Commitment.prototype, "commitmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Commitment.prototype, "accountType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Commitment.prototype, "commitmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Commitment.prototype, "obligationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CommitmentStatus,
        default: CommitmentStatus.PLANNED
    }),
    __metadata("design:type", String)
], Commitment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Amount committed is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Amount committed must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Amount committed must be a positive number' }),
    __metadata("design:type", Number)
], Commitment.prototype, "amountCommitted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Commitment.prototype, "amountObligated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Commitment.prototype, "amountExpended", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Commitment.prototype, "projectedFullExpenditureDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Commitment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Commitment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Commitment.prototype, "updatedAt", void 0);
exports.Commitment = Commitment = __decorate([
    (0, typeorm_1.Entity)('commitments')
], Commitment);
