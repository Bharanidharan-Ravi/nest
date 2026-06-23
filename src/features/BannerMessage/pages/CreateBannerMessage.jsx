import { useParams } from "react-router-dom"
import { getMessageType, useBannerMessage } from "../hooks/useBannerdata"
import { BannerFormConfig } from "../config/BannerForm.config"
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage"

const CreateBanner=()=>{
const params=useParams()
const isEdit=!!params.BannerMessageId
const {data:MessageType}=getMessageType();

const {data:bannerListWrapper}=useBannerMessage(
    isEdit?params.BannerMessageId:null
)

  // Extract single entity from sync/v2 array response
  const entityData =
    isEdit &&
    Array.isArray(bannerListWrapper) &&
    bannerListWrapper.length > 0
      ? bannerListWrapper.find(
        item=>item.BannerMessageId===params.BannerMessageId
      )??null
      : null

  // Status options — string values matching DB varchar(100)
  const statusOptions = [
    { label: "Active",   value: { id: "Active",   name: "Active"   } },
    { label: "Inactive", value: { id: "Inactive", name: "Inactive" } },
  ]

  const statusField = {
    name:    "status",
    label:   "Label Status",
    type:    "select",
    ui:      "mui",
    apiKey:  "Status",
    options: statusOptions,
    required: true,

    initValueResolver: (context) => {
      // On create — default Active
      if (!context.isEdit || !context.entityData) {
        return statusOptions[0]
      }

      const apiStatus = context.entityData?.Status

      const matched = statusOptions.find(
        (opt) => opt.value.id === apiStatus || opt.label === apiStatus
      )

      return matched ?? statusOptions[0]
    },
  }


  const MessageTypeOption=(MessageType||[]).map(mt=>({
    label:mt.Type_Name,
    value:{id:mt.MessageTypeId,name:mt.Type_Name}
  }))

  const MessageTypefield={
    name:"MessageType",
    label:"Message Type",
    type:"select",
    ui:"mui",
    apiKey:"MessageTypeId",
    options:MessageTypeOption,
    required:true,
    initValueResolver: (context) => {
      // On create — default Active
      if (!context.isEdit || !context.entityData) {
        return MessageTypeOption[0]??null
      }
      const apiVal = context.entityData?.MessageTypeId;
      const matched = MessageTypeOption.find(
        (opt) => opt.value.id === apiVal || opt.label === apiVal
      )

      return matched ?? MessageTypeOption[0]??null;
    },
  }
const basefields=BannerFormConfig.fields.filter(
  f=>f.name!="MessageType"
)
  const dynamicConfig = {
    ...BannerFormConfig,
    // PUT /api/label/{id} on edit, POST /api/label on create
    api: isEdit ? `/Bannermessage/UpdateBannerMessage/${params.BannerMessageId}` : BannerFormConfig.api,
    fields: isEdit
      ? [...basefields, statusField,MessageTypefield]  // status only on edit
      : [...basefields,MessageTypefield],
  }
  
  return (
    <div>
      <h2>{isEdit ? "Edit Message" : "Create Message"}</h2>
      <EntityFormPage
        mode={isEdit ? "Update" : "Create"}
        config={dynamicConfig}
        context={{ params, isEdit, entityData }}
        module="Message"
      />
    </div>
  )

}
export default CreateBanner