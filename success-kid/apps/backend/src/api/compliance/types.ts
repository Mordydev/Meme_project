/**
 * Types for the Compliance API module
 */
import { RequestType } from '../../compliance/gdpr/service'; // Assuming RequestType is exported

export interface GdprRequestBody {
  type: RequestType;
}

export interface GdprRequestIdParam {
  id: string;
}

export interface ConsentRequestBody {
  purpose: string;
  granted: boolean;
}

export interface ConsentPurposeParam {
  purpose: string;
}

export interface ReportRequestBody {
  type: string;
  period: {
    start: string; // Consider date-time format
    end: string;   // Consider date-time format
  };
}

export interface ReportIdParam {
  id: string;
}

export interface ListReportsQuery {
  type?: string;
  status?: string;
  fromDate?: string; // Consider date-time format
  toDate?: string;   // Consider date-time format
}

export interface FrameworkIdParam {
  id: string;
}

// Re-export RequestType if needed by handlers/routes directly
export { RequestType };
