// registry/inputRegistry.js

import AdvancedEditor from "../adapters/advanceEditor/AdvanceEditor";
import HtmlDateInput from "../adapters/html/HtmlDateInput";
import HtmlSelectInput from "../adapters/html/HtmlSelectInput";
import HtmlTextInput from "../adapters/html/HtmlTextInput";
import HtmlTimeInput from "../adapters/html/HtmlTimeInput";
import MuiDateInput from "../adapters/mui/MuiDateInput";
import MuiFlexibleHoursInput from "../adapters/mui/MuiFlexibleTimeInput";
import MuiGroupInput from "../adapters/mui/MuiGroupInput";
import MuiSelectInput from "../adapters/mui/MuiSelectInput";
import MuiTextInput from "../adapters/mui/MuiTextInput";
import MuiTimeInput from "../adapters/mui/MuiTimeInput";

export const inputRegistry = {
  mui: {
    text: MuiTextInput,
    select: MuiSelectInput,
    date: MuiDateInput,
    time: MuiTimeInput,
    group: MuiGroupInput,
    flexHours: MuiFlexibleHoursInput 
  },
  html: {
    text: HtmlTextInput,
    select: HtmlSelectInput,
    date: HtmlDateInput,
    time: HtmlTimeInput
  },
  editor: {
    adEditor: AdvancedEditor,
  }
};