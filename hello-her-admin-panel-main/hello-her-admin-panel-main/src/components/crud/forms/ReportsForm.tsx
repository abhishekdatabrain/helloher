"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { flattenOneLevelPreserveKeys, populateFormData, populateFormFields } from "@/hooks/general";
import { reportFormFields } from "../formtype/general";
// Define the fields for the report form

interface ReportsFormProps {
	data?: any;
	onClose?: any;
	formType: any;
	setPaginate?: any;
	setFilteredData?: any;
}

const ReportsForm: React.FC<ReportsFormProps> = (props: any) => {
	const data = props.data || {};
	const formType = props.formType;
	const [submitting, setSubmitting] = useState(false);

	const formField =
		data._id
			? populateFormFields(reportFormFields, data)
			: reportFormFields;

	const [formData, setFormData] = useState<any>(
		data._id ? populateFormData(reportFormFields, flattenOneLevelPreserveKeys(data)) : {}
	);

	const makeApiCall = async (updatedData: any) => {
		try {
			const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id}`;
			setSubmitting(true);
			let payload: any = {};
			if (data._id) {
				// Only update fields that are not isDisabled:true in reportFormFields
				const editableFields = reportFormFields.filter(f => !f.isDisabled).map(f => f.name);
				if (updatedData instanceof FormData) {
					editableFields.forEach((field) => {
						const value = updatedData.get(field);
						if (value !== undefined) payload[field] = value;
					});
				} else {
					editableFields.forEach((field) => {
						if (updatedData[field] !== undefined) payload[field] = updatedData[field];
					});
				}
			} else {
				// Create: only send reportedUserId and message
				if (updatedData instanceof FormData) {
					payload = {
						reportedUserId: updatedData.get("reportedUserId"),
						message: updatedData.get("message")
					};
				} else {
					payload = {
						reportedUserId: updatedData.reportedUserId,
						message: updatedData.message
					};
				}
			}
			const response: any = data._id
				? await Put(url, payload, 20000)
				: await Post(url, payload, 20000);

			if (response.success) {
				const fetchUrl = `${endpoints[formType].url}`;
				const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
				if (resp?.success) props?.setFilteredData(resp?.data?.result);
				if (resp?.success && resp?.data?.pagination)
					props?.setPaginate(resp?.data?.pagination);
				props.onClose?.();
			} else return toast.error("Something went wrong!");
		} catch (error) {
			console.log("Error: ", error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div>
			<h2 className="text-xl pb-4 font-semibold text-gray-800">
				{data?._id ? "Edit Report" : "Add New Report"}
			</h2>
			<DynamicForm
				id={data._id}
				fields={formField}
				returnAs="formData"
				formData={formData}
				submitting={submitting}
				onClose={props?.onClose}
				setFormData={setFormData}
				makeApiCall={makeApiCall}
			/>
		</div>
	);
};

export default ReportsForm;
