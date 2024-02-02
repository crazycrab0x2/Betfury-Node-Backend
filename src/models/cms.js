const mongoose = require("mongoose");
const tblConfig = require("../config/tablemanage");
const Schema = mongoose.Schema;
const AutoIncrement = require("mongoose-sequence")(mongoose);

const CountrySchema = new Schema({
  country: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  phonecode: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  countryOrder: Number,
});
CountrySchema.plugin(AutoIncrement, { inc_field: "countryOrder" });

const languageSchema = new Schema({
  language: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
  },
});

const multiLangSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  transtext: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
  },
});

const SupportTypesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
  },
});

const SupportDataSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
  },
});

const siteconfigSchema = new Schema({
  key: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  detail: {
    type: Object,
    default: {},
  },
});

const sliderSchema = new Schema({
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String, // desktop, mobile
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
});

const pokersliderSchema = new Schema({
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String, // desktop, mobile
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  language: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
});

const SidebarBaseMenuSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
  },
});

const SidebarMainMenuSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  base: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  sidebar: {
    type: Boolean,
    default: true,
  },
  mobileSidebar: {
    type: Boolean,
    default: true,
  },
  onHome: {
    type: Boolean,
    default: true,
  },
  onGame: {
    type: Boolean,
    default: true,
  },
  onMBFooter: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
  },
});

const FooterMenuSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
  },
});

module.exports = {
  CountryList: mongoose.model(tblConfig.country_lists, CountrySchema),
  LanguageList: mongoose.model(tblConfig.site_language, languageSchema),
  MultiLangList: mongoose.model(tblConfig.site_multi_text, multiLangSchema),
  SupportTypes: mongoose.model(tblConfig.support_types, SupportTypesSchema),
  SiteConfigs: mongoose.model(tblConfig.site_configs, siteconfigSchema),
  SliderDatas: mongoose.model(tblConfig.site_sliders, sliderSchema),
  PokerSliderDatas: mongoose.model(
    tblConfig.site_poker_sliders,
    pokersliderSchema
  ),
  SupportData: mongoose.model(tblConfig.support_datas, SupportDataSchema),
  SidebarBaseMenu: mongoose.model(
    tblConfig.site_sidebar_base_menu,
    SidebarBaseMenuSchema
  ),
  SidebarMainMenu: mongoose.model(
    tblConfig.site_sidebar_main_menu,
    SidebarMainMenuSchema
  ),
  FooterMenuList: mongoose.model(tblConfig.site_footer_menu, FooterMenuSchema),
};
