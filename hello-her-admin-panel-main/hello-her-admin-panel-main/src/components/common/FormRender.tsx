import FaqForm from "../crud/forms/FaqForm";
import CityForm from "../crud/forms/CityForm";
import NoFormFallback from "./NoFormFallback";
import BlogForm from "../crud/forms/BlogForm";
import RoomForm from "../crud/forms/RoomForm";
import UserForm from "../crud/forms/Adminform";
import StateForm from "../crud/forms/StateForm";
import BannerForm from "../crud/forms/BannerForm";
import CouponForm from "../crud/forms/CouponForm";
import ManageRoleForm from "../crud/forms/Roleform";
import Featureform from "../crud/forms/Featureform";
import CountryForm from "../crud/forms/CountryForm";
import AmenityForm from "../crud/forms/AmenityForm";
import PricingForm from "../crud/forms/PricingForm";
import PropertyForm from "../crud/forms/PropertyForm";
import CategoryForm from "../crud/forms/CategoryForm";
import TestimonialForm from "../crud/forms/TestimonialForm";
import FaqCategoryForm from "../crud/forms/FaqCategoryForm";
import EditHelpDeskUser from "../crud/forms/EditHelpDeskUser";
import HelpdeskForm from "../crud/forms/HelpdeskForm";
import NearByPlacesForm from "../crud/forms/NearByPlacesForm";
import PropertyCityForm from "../crud/forms/PropertyCityForm";
import AdvancedBulkUploadComponent from "./BulkUploadComponent";
import HelpDeskAgentModal from "../crud/forms/HelpDeskAgentModal";
import SubscriptionPlanform from "../crud/forms/SubscriptionPlanform";
import CleaningScheduleForm from "../crud/forms/CleaningScheduleForm";
import ServiceProviderForm from "../crud/forms/ServiceProviderForm";
import RechargePlanForm from "../crud/forms/RechargePlanForm";
import TermsForm from "../crud/forms/TermsForm";
import PolicyForm from "../crud/forms/PolicyForm";
import WithdrawalFrom from "../crud/forms/WithdrawalFrom";
import EditUserForm from "../crud/forms/EditUserForm";
import CommissionForm from "../crud/forms/CommissionForm";
import ProfilePlanForm from "../crud/forms/ProfilePlanForm";
import QueryForm from "../crud/forms/QueryForm";
import IssueForm from "../crud/forms/IssuesForm";
import AvatarForm from "../crud/forms/AvatarForm";
import AgreementForm from "../crud/forms/AgreementForm";
import ReportsForm from "../crud/forms/ReportsForm";
import SOSForm from "../crud/forms/SOSForm";
import BankForm from "../crud/forms/BankForm";
import LanguageForm from "../crud/forms/LanguageForm";
import ReviewForm from "../crud/forms/ReviewForm";
interface FormRendererProps {
  data: any;
  onClose?: any;
  formType: string;
  setPaginate?: any;
  setFilteredData?: any;
  additionalParams?: Record<string, any>;
}

const FormRenderer: React.FC<FormRendererProps> = (props: any) => {
  switch (props.formType) {
    case "Review":
      return <ReviewForm {...props} />;
    case "Agent":
      return <HelpDeskAgentModal {...props} />;
    case "Property Wise City":
      return <PropertyCityForm {...props} />;
    case "Import":
      return <AdvancedBulkUploadComponent {...props} />;
    case "Coupon":
      return <CouponForm {...props} />;
    case "Blog":
      return <BlogForm {...props} />;
    case "Testimonial":
      return <TestimonialForm {...props} />;
    case "House Keeping":
      return <CleaningScheduleForm {...props} />;
    case "Blog Category":
      return <CategoryForm {...props} />;
    case "Amenities":
      return <AmenityForm {...props} />;
    case "Properties":
      return <PropertyForm {...props} />;
    case "Near By Places":
      return <NearByPlacesForm {...props} />;
    case "Role Management":
      return <ManageRoleForm {...props} />;
    case "Room":
      return <RoomForm {...props} />;
    case "Pricing":
      return <PricingForm {...props} />;
    case "FAQs":
      return <FaqForm {...props} />;
    case "FAQ Category":
      return <FaqCategoryForm {...props} />;
    case "ServiceProviders":
      return <ServiceProviderForm {...props} />;
    case "Commission":
      return <CommissionForm {...props} />;
    case "Recharge":
      return <RechargePlanForm {...props} />;
    case "Terms":
      return <TermsForm {...props} />;
    case "Policy":
      return <PolicyForm {...props} />;
    case "Withdrawals":
      return <WithdrawalFrom {...props} />;
    case "Banner":
      return <BannerForm {...props} />;
    case "Country":
      return <CountryForm {...props} />;
    case "State":
      return <StateForm {...props} />;
    case "City":
      return <CityForm {...props} />;
    case "Feature":
      return <Featureform {...props} />;
    case "Employee":
      return <UserForm {...props} />;
    case "Customer Support":
      return <EditHelpDeskUser {...props} />;
    case "Subscription Plan":
      return <SubscriptionPlanform {...props} />;
    case "Users":
      return <EditUserForm {...props} />;
    case "Profile Plan":
      return <ProfilePlanForm {...props} />;
    case "Query":
      return <QueryForm {...props} />;
    case "Issue":
      return <IssueForm {...props} />;
    case "Helpdesk":
      return <HelpdeskForm {...props} />;
    case "Avatar":
      return <AvatarForm {...props} />;
    case "Agreement":
      return <AgreementForm {...props} />;
    case "Reports":
      return <ReportsForm {...props} />;
    case "SOS":
      return <SOSForm {...props} />;
    case "Bank":
      return <BankForm {...props} />;
    case "Language":
      return <LanguageForm {...props} />;
    default:
      return <NoFormFallback />;
  }
};

export default FormRenderer;
