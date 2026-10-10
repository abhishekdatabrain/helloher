import Admin from "../../modals/admin.model";
import Role from "../../modals/role.model";
import ApiResponse from "../../utils/ApiResponse";
import { generateAccessToken } from "../../utils/token";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";

const adminService = new CommonService(Admin);

const resolveRoleRef = async (roleInput: unknown) => {
  if (!roleInput) return null;

  if (typeof roleInput === "object" && roleInput !== null) {
    const roleId = (roleInput as any)?._id;
    if (roleId) {
      const found = await Role.findById(roleId).exec();
      if (found) return found;
    }
  }

  const roleValue = String(roleInput).trim();
  if (!roleValue) return null;

  if (roleValue.match(/^[a-f\d]{24}$/i)) {
    const found = await Role.findById(roleValue).exec();
    if (found) return found;
  }

  return Role.findOne({ name: roleValue.toLowerCase() }).exec();
};

export class AdminController {
  /**
   * Create a new user
   */
  static async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password, role, status, wallet, monthlyEarning, totalEarning } = req.body;
      const resolvedRole = await resolveRoleRef(role);
      if (!resolvedRole) {
        return res.status(400).json({
          success: false,
          message: "Valid role is required",
        });
      }
      const user = await AdminController.createUser({
        role: resolvedRole._id.toString(),
        email,
        username,
        password,
        status: status === "active",
        wallet,
        monthlyEarning,
        totalEarning,
      });
      res
        .status(201)
        .json({ success: true, message: "User created successfully", user });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;
      let admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }
      admin = JSON.parse(JSON.stringify(admin));

      res.status(200).json({
        success: true,
        data: { ...admin, password: "" },
        message: "Admin retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;
      const { username, role, status } = req.body;
      const resolvedRole = role ? await resolveRoleRef(role) : null;
      if (role && !resolvedRole) {
        return res.status(400).json({
          success: false,
          message: "Valid role is required",
        });
      }
      const updatedUser = await Admin.findByIdAndUpdate(
        id,
        { username, ...(resolvedRole ? { role: resolvedRole._id } : {}), status: status === "active" },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;
      const deleted = await adminService.deleteById(id);
      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
        user: deleted,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllAdmins(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const pipeline = [{
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleData",
        },
      },
      { $unwind: "$roleData" },
      {
        $project: {
          _id: 1,
          email: 1,
          status: 1,
          username: 1,
          wallet: 1,
          monthlyEarning: 1,
          totalEarning: 1,
          createdAt: 1,
          updatedAt: 1,
          role: "$roleData.name",
          roleId: "$roleData._id",
        },
      }];
      const result = await adminService.getAll(req.query, pipeline);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Employees fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async loginAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const data = await AdminController.loginUser({ email, password });

      // Send response with the token
      res.status(200).json({
        success: true,
        message: "Login successful",
        token: data.token, // Send the token in response
        user: {
          _id: data.user._id,
          role: data?.user.role,
          roleId: (data?.user.role as any)?._id ?? data?.user.role,
          email: data.user.email,
          username: data.user.username,
          wallet: data.user.wallet,
          monthlyEarning: data.user.monthlyEarning,
          totalEarning: data.user.totalEarning,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the current user details based on the provided JWT token
   * @param {Request} req - The request object
   * @param {Response} res - The response object
   * @param {NextFunction} next - The next middleware function
   */
  static async getCurrentAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user.id; // Extracted from the decoded JWT token
      const user = await AdminController.getUserById(userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return; // Returning to prevent further execution
      }

      res.status(200).json({
        success: true,
        message: "User details fetched successfully",
        user: {
          _id: user._id,
          role: user.role,
          roleId: (user.role as any)?._id ?? user.role,
          email: user.email,
          username: user.username,
          wallet: user.wallet,
          monthlyEarning: user.monthlyEarning,
          totalEarning: user.totalEarning,
        },
      });
    } catch (error) {
      next(error); // Pass errors to the error handling middleware
    }
  }
  /**
   * Get user details by user ID
   */
  static async getUserById(userId: string) {
    const user = await Admin.findOne({ _id: userId, status: true }).populate("role");
    return user;
  }

  /**
   * Create a new user
   */
  static async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: string;
    status: boolean;
    wallet?: number;
    monthlyEarning?: number;
    totalEarning?: number;
  }) {
    const { username, email, password, role, status, wallet = 0, monthlyEarning = 0, totalEarning = 0 } = userData;

    const existingUser = await Admin.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser)
      throw new Error("User with this email or username already exists");

    const user = new Admin({ username, email, password, role, status, wallet, monthlyEarning, totalEarning });
    return await user.save();
  }

  /**
   * Login a user
   */
  static async loginUser(loginData: { email: string; password: string }) {
    const { email, password } = loginData;

    const user: any = await Admin.findOne({ email }).populate("role");
    if (!user) throw new Error("User not found with this email");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error("Password is incorrect");

    const payload = {
      email: user.email,
      id: user._id as string,
      role: (user?.role?.name as any) ?? "admin",
    };
    const accessToken = generateAccessToken(payload);
    await user.save();

    return {
      user,
      token: accessToken,
      message: "Login successful",
    };
  }
}
