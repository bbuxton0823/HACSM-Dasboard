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
exports.BudgetAuthority = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
let BudgetAuthority = class BudgetAuthority {
};
exports.BudgetAuthority = BudgetAuthority;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BudgetAuthority.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Total budget amount is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Total budget amount must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Total budget amount must be a positive number' }),
    __metadata("design:type", Number)
], BudgetAuthority.prototype, "totalBudgetAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Fiscal year is required' }),
    __metadata("design:type", Number)
], BudgetAuthority.prototype, "fiscalYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BudgetAuthority.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Effective date is required' }),
    __metadata("design:type", Date)
], BudgetAuthority.prototype, "effectiveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], BudgetAuthority.prototype, "expirationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], BudgetAuthority.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BudgetAuthority.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], BudgetAuthority.prototype, "updatedAt", void 0);
exports.BudgetAuthority = BudgetAuthority = __decorate([
    (0, typeorm_1.Entity)('budget_authority')
], BudgetAuthority);
