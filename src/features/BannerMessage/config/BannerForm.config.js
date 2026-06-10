import { queryKeys } from "../../../core/query/queryKeys"
import { BannerFieldConfig } from "./Banner.config"


export const BannerFormConfig = {
  key: "banner",
  title: "Banner",
  type:"hidden",
  api: "/Bannermessage/CreateBannerMessage",                          // POST /api/label

  // Invalidate full label list after create or update
  invalidateKeys: [queryKeys.BannerData.list()],

  redirectTo: ({ goBack }) => goBack(),

  fields: BannerFieldConfig(),
}

