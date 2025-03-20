// Enum for voucher types
export enum VoucherType {
  TENANT_BASED = 'tenant_based',
  PROJECT_BASED = 'project_based',
  HOMEOWNERSHIP = 'homeownership',
  EMERGENCY_HOUSING = 'emergency_housing',
  HUD_VASH = 'hud_vash',
  PERMANENT_SUPPORTIVE = 'permanent_supportive',
  MAINSTREAM = 'mainstream',
  SPECIAL_PURPOSE = 'special_purpose',
  MTW_FLEXIBLE = 'mtw_flexible',
  OTHER = 'other'
}

// Interface for HCV Utilization data
export interface HCVUtilizationData {
  id: string;
  reportingDate: string;
  voucherType: VoucherType;
  authorizedVouchers: number;
  leasedVouchers: number;
  utilizationRate: number;
  hapExpenses: number;
  averageHapPerUnit: number;
  budgetUtilization: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for HCV Utilization form data
export interface HCVUtilizationFormData {
  reportingDate: Date | null;
  voucherType: VoucherType;
  authorizedVouchers: number;
  leasedVouchers: number;
  hapExpenses: number;
  notes?: string;
}

// Interface for HCV Utilization upload response
export interface HCVUtilizationUploadResponse {
  message: string;
  data: {
    imported: number;
    errors: any[];
  };
}

// Interface for HCV reports response
export interface HCVReportResponse {
  message: string;
  data: {
    summary?: string;
    report?: string;
    forecast?: string;
    voucherType?: string;
    timeframe?: {
      startDate: string;
      endDate: string;
    };
    forecastMonths?: number;
    dataPointsAnalyzed: number;
  };
}
