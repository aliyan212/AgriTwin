import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  translations,
  getLocalizedCropName,
  getLocalizedStageName,
} from "../translations.ts";

describe("Punjabi & English Localization Engine", () => {
  test("Dictionary Parity: every English key exists in Punjabi translation", () => {
    const enKeys = Object.keys(translations.en);
    const urKeys = Object.keys(translations.ur);

    const missingInUrdu = enKeys.filter((k) => !(k in translations.ur));
    assert.deepEqual(
      missingInUrdu,
      [],
      `The following keys are missing in translations.ur: ${missingInUrdu.join(", ")}`
    );

    assert.ok(enKeys.length > 50, "Expected comprehensive dictionary with over 50 keys");
    assert.equal(enKeys.length, urKeys.length, "English and Punjabi dictionary length must match");
  });

  test("Crop Name Localization (getLocalizedCropName)", () => {
    // English mode returns original
    assert.equal(getLocalizedCropName("Wheat", false), "Wheat");
    assert.equal(getLocalizedCropName("Cotton", false), "Cotton");

    // Punjabi mode translates to authentic terminology
    assert.equal(getLocalizedCropName("Wheat", true), "گندم (کنک)");
    assert.equal(getLocalizedCropName("Rice (Basmati)", true), "دھان (باسمتی چاول)");
    assert.equal(getLocalizedCropName("Cotton", true), "کپاس (پھٹی)");
    assert.equal(getLocalizedCropName("Sugarcane", true), "کماد (گنا)");
    assert.equal(getLocalizedCropName("Maize", true), "مکئی (چھلی)");
  });

  test("Crop Growth Stage Localization (getLocalizedStageName)", () => {
    // English mode returns original stage
    assert.equal(getLocalizedStageName("Tillering", false), "Tillering");

    // Wheat stages in Punjabi
    assert.equal(getLocalizedStageName("Germination", true), "اگاؤ (بیج اکھاڑنا)");
    assert.equal(getLocalizedStageName("Tillering", true), "شگوفے (پھوٹ / ترنجاں)");
    assert.equal(getLocalizedStageName("Jointing", true), "گنڈھ بننا (گانٹھاں)");
    assert.equal(getLocalizedStageName("Booting", true), "گوپھ (گوبھ مرحلہ)");
    assert.equal(getLocalizedStageName("Grain Filling", true), "دانہ بھرائی (دودھیا حالت)");
    assert.equal(getLocalizedStageName("Maturity", true), "پکائی (تیار فصل)");

    // Rice, Cotton, Sugarcane, and Maize stages
    assert.equal(getLocalizedStageName("Nursery", true), "پنیری (پود تیار کرنا)");
    assert.equal(getLocalizedStageName("Squaring", true), "ڈوڈیاں بننا (ڈوڈی مرحلہ)");
    assert.equal(getLocalizedStageName("Boll Formation", true), "ٹینڈے بننا");
    assert.equal(getLocalizedStageName("Grand Growth", true), "تیز بڑھوتری (وادھا)");
    assert.equal(getLocalizedStageName("Tasseling", true), "جھنڈا سِٹا (ٹیسلنگ)");
    assert.equal(getLocalizedStageName("Silking", true), "ریشم نکلنا (سلکنگ)");
  });
});
