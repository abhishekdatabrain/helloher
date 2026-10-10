import { Request, Response } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { ContactUS } from "../../modals/contactUs.model";
import { contactUsContent } from "../../utils/emailContent";
import { isValidObjectId } from "../../utils/helper";
import { CommonService } from "../../services/common.services";
import { sendEmail } from "../../config/nodeMailerConfig";
import { config } from "../../config/config";

const contactService = new CommonService(ContactUS);

// Raise a query
const raiseQuery = asyncHandler(async (req: Request, res: Response) => {
  const { senderName, senderEmail, query, senderMobile } = req.body;

  if (
    [senderName, senderEmail, query, senderMobile].some(
      (field: string) => !field?.trim()
    )
  ) {
    return res
      .status(400)
      .json(new ApiError(400, "", "All fields are mandatory"));
  }

  const raisedQuery = await contactService.create({
    senderName,
    senderEmail,
    senderMobile,
    query,
  });

  if (!raisedQuery) {
    return res
      .status(500)
      .json(
        new ApiError(500, "", "Something went wrong while raising the query!")
      );
  }

  // Send mail notification to admin
  const htmlContent = contactUsContent(
    senderName,
    senderEmail,
    query,
    senderMobile
  );
  const subject = "New Contact Form Submission from HelloHer Website";

  // Send email to admin
  try {
    await sendEmail(
      config.email.user as string, // Admin email
      subject,
      htmlContent
    );

    // Send confirmation email to user
    // const userConfirmationHtml = `
    //   <h2>Thank you for contacting HelloHer!</h2>
    //   <p>Dear ${senderName},</p>
    //   <p>We have received your message and will get back to you as soon as possible.</p>
    //   <p><strong>Your Message:</strong></p>
    //   <p>${query.replace(/\n/g, '<br>')}</p>
    //   <p>Best regards,<br>HelloHer Team</p>
    // `;

    // Send email to user
    // await sendEmail(
    //   senderEmail,
    //   // "helloher.official@gmail.com",
    //   "We received your message - HelloHer",
    //   userConfirmationHtml
    // );
  } catch (emailError) {
    console.error("⚠️ Error sending email:", emailError);
    // Don't fail the request if email fails, just log it
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Query raised successfully"));
});

// Change query status
const changeQueryStatus = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.params;
  const { status } = req.body;

  if (!isValidObjectId(_id)) {
    return res.status(400).json(new ApiError(400, "", "Invalid Object ID"));
  }

  const updatedQuery = await contactService.updateById(_id, { status });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { result: updatedQuery },
        "Query status changed successfully"
      )
    );
});

// Get all queries
const getQueryList = asyncHandler(async (req: Request, res: Response) => {
  const result = await contactService.getAll(req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "List fetched successfully"));
});

// Get query by ID
const getQueryById = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.params;
  const query = await contactService.getById(_id, false);
  return res
    .status(200)
    .json(new ApiResponse(200, query, "Query fetched successfully"));
});

// Delete query by ID
const deleteQuery = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.params;

  if (!isValidObjectId(_id)) {
    return res.status(400).json(new ApiError(400, "", "Invalid query ID"));
  }

  const deleted = await contactService.deleteById(_id);

  if (!deleted) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Query not found or already deleted"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Query deleted successfully"));
});

export {
  raiseQuery,
  changeQueryStatus,
  getQueryList,
  getQueryById,
  deleteQuery,
};
