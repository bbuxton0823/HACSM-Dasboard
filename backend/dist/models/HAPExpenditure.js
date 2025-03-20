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
exports.HAPExpenditure = exports.ExpenditureType = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
var ExpenditureType;
(function (ExpenditureType) {
    ExpenditureType["TRADITIONAL_HAP"] = "traditional_hap";
    ExpenditureType["PUBLIC_HOUSING"] = "public_housing";
    ExpenditureType["CAPITAL_FUND"] = "capital_fund";
    ExpenditureType["LOCAL_NON_TRADITIONAL"] = "local_non_traditional";
    ExpenditureType["HCV_ADMIN"] = "hcv_admin";
    ExpenditureType["OTHER_1"] = "other_1";
    ExpenditureType["OTHER_2"] = "other_2";
    ExpenditureType["OTHER_3"] = "other_3";
})(ExpenditureType || (exports.ExpenditureType = ExpenditureType = {}));
let HAPExpenditure = class HAPExpenditure {
};
exports.HAPExpenditure = HAPExpenditure;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], HAPExpenditure.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Expenditure date is required' }),
    __metadata("design:type", Date)
], HAPExpenditure.prototype, "expenditureDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ExpenditureType
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Expenditure type is required' }),
    __metadata("design:type", String)
], HAPExpenditure.prototype, "expenditureType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Amount is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Amount must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Amount must be a positive number' }),
    __metadata("design:type", Number)
], HAPExpenditure.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], HAPExpenditure.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], HAPExpenditure.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HAPExpenditure.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HAPExpenditure.prototype, "updatedAt", void 0);
exports.HAPExpenditure = HAPExpenditure = __decorate([
    (0, typeorm_1.Entity)('hap_expenditures')
], HAPExpenditure);
