import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import { Bank, IBank } from "../../modals/bank.model";
import { CommonService } from "../../services/common.services";

const bankService = new CommonService<IBank>(Bank);

// CREATE BANK
export const createBank = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const bank = await bankService.create(req.body);
        return res
            .status(201)
            .json(new ApiResponse(201, bank, "Bank created successfully"));
    } catch (error) {
        next(error);
    }
};

// GET ALL BANKS
export const getAllBanks = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // normalize query and pagination flag
        const queryObj: any = { ...req.query };
        let disablePagination = false;
        if (queryObj.pagination === "false" || queryObj.pagination === false) {
            disablePagination = true;
        } else if (queryObj.pagination === "true") {
            queryObj.pagination = true;
        }

        if (disablePagination) {
            // remove pagination/related parameters for raw find
            const filters: any = { ...queryObj };
            delete filters.pagination;
            delete filters.page;
            delete filters.limit;
            delete filters.sortKey;
            delete filters.sortDir;

            const allBanks = await Bank.find(filters);
            return res
                .status(200)
                .json(new ApiResponse(200, allBanks, "Banks fetched successfully"));
        }

        const result: any = await bankService.getAll(queryObj);

        return res
            .status(200)
            .json(new ApiResponse(200, result, "Banks fetched successfully"));
    } catch (error) {
        next(error);
    }
};

// GET BANK BY ID
export const getBankById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const bank = await bankService.getById(req.params.id);
        return res
            .status(200)
            .json(new ApiResponse(200, bank, "Bank fetched successfully"));
    } catch (error) {
        next(error);
    }
};

// UPDATE BANK
export const updateBank = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const bank = await bankService.updateById(req.params.id, req.body);
        return res
            .status(200)
            .json(new ApiResponse(200, bank, "Bank updated successfully"));
    } catch (error) {
        next(error);
    }
};

// DELETE BANK
export const deleteBank = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const bank = await bankService.deleteById(req.params.id);
        return res
            .status(200)
            .json(new ApiResponse(200, bank, "Bank deleted successfully"));
    } catch (error) {
        next(error);
    }
};

// export const addBulkBanks = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const banks = req.body; // expect array

//     if (!Array.isArray(banks) || banks.length === 0) {
//       throw new Error("Request body must be a non-empty array");
//     }

//     const createdBanks = await Promise.all(
//       banks.map((bank) => bankService.create(bank))
//     );

//     return res
//       .status(201)
//       .json(new ApiResponse(201, createdBanks, "Banks added successfully"));
//   } catch (error) {
//     next(error);
//   }
// };