import { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { CommonService } from "../../services/common.services";
import AgreementModel from "../../modals/agreement.model";

const agreementService = new CommonService(AgreementModel);

// ✅ Create Agreement (upload pdfUrl from S3)
export const createAgreement = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let { title, pdfUrl } = req.body;

        // Handle pdfUrl as array from frontend file upload
        if (Array.isArray(pdfUrl) && pdfUrl.length > 0) {
            pdfUrl = pdfUrl[0].url;
        }

        if (!pdfUrl) {
            throw new ApiError(400, "PdfUrl is required");
        }

        const created = await agreementService.create({
            title,
            pdfUrl,
            isActive: true,
        });

        return res
            .status(201)
            .json(new ApiResponse(201, created, "Agreement created"));
    } catch (error) {
        next(error);
    }
};

// ✅ Get All Agreements
export const getAllAgreements = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await agreementService.getAll(req.query);
        return res
            .status(200)
            .json(new ApiResponse(200, data, "Agreements fetched"));
    } catch (error) {
        next(error);
    }
};

// ✅ Get Agreement By Id
export const getAgreementById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await agreementService.getById(req.params.id);
        return res
            .status(200)
            .json(new ApiResponse(200, data, "Agreement fetched"));
    } catch (error) {
        next(error);
    }
};

// ✅ Update Agreement
export const updateAgreement = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // if a file was uploaded the s3 middleware will replace req.body.pdfUrl
        // with an array of upload objects. Mongoose expects a string, so convert it.
        let { pdfUrl } = req.body;
        if (Array.isArray(pdfUrl) && pdfUrl.length > 0) {
            req.body.pdfUrl = pdfUrl[0].url || pdfUrl[0];
        }

        const updated = await agreementService.updateById(
            req.params.id,
            req.body
        );

        return res
            .status(200)
            .json(new ApiResponse(200, updated, "Agreement updated"));
    } catch (error) {
        next(error);
    }
};

// ✅ Delete Agreement
export const deleteAgreement = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const deleted = await agreementService.deleteById(req.params.id);

        return res
            .status(200)
            .json(new ApiResponse(200, deleted, "Agreement deleted"));
    } catch (error) {
        next(error);
    }
};