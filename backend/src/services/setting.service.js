import { prisma } from '../config/database.js';

export const defaultSettings = {
  instituteName: "Renuka Paramedical Institute",
  logo: "/logo.png",
  address: "Shree Bussiness Building, First Floor, Chinchkar Chowk, Pragatinagar, Baramati, Maharashtra 413102",
  mobile: "+91 913048003",
  email: "renukaparamedical@gmai.com",
};

export class SettingService {
  static async getSettings() {
    let settings = await prisma.instituteSetting.findFirst();

    if (!settings) {
      settings = await prisma.instituteSetting.create({
        data: {
          instituteName: defaultSettings.instituteName,
          logoUrl: defaultSettings.logo,
          address: defaultSettings.address,
          mobile: defaultSettings.mobile,
          email: defaultSettings.email,
        },
      });
    }

    return {
      instituteName: settings.instituteName,
      logo: settings.logoUrl || defaultSettings.logo,
      address: settings.address,
      mobile: settings.mobile,
      email: settings.email,
    };
  }

  static async updateSettings(data) {
    let settings = await prisma.instituteSetting.findFirst();

    const payload = {
      instituteName: data.instituteName.trim(),
      logoUrl: data.logo || defaultSettings.logo,
      address: data.address.trim(),
      mobile: data.mobile.trim(),
      email: data.email.trim(),
    };

    if (settings) {
      settings = await prisma.instituteSetting.update({
        where: { id: settings.id },
        data: payload,
      });
    } else {
      settings = await prisma.instituteSetting.create({
        data: payload,
      });
    }

    return {
      instituteName: settings.instituteName,
      logo: settings.logoUrl,
      address: settings.address,
      mobile: settings.mobile,
      email: settings.email,
    };
  }
}
