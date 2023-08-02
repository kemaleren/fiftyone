import { Locator, Page, expect } from "src/oss/fixtures";

export class ColorModalPom {
  readonly page: Page;
  readonly colorModal: Locator;
  readonly assert: ColorModalAsserter;

  constructor(page: Page) {
    this.page = page;
    this.assert = new ColorModalAsserter(this);
    this.colorModal = page.locator("#colorModal");
  }

  async closeColorModal() {
    const closeButton = this.page.getByTestId("close-color-modal");
    await closeButton.click();
  }

  async selectActiveField(fieldName: string) {
    const fieldSelector = this.page.getByTestId(
      `color-modal-list-item-${fieldName}`
    );
    await fieldSelector.selectOption(fieldName);
  }

  async setColorBy(mode: "value" | "field") {
    const globalTab = this.page.getByTestId(
      "color-modal-list-item-Global settings"
    );
    await globalTab.click();
    const modeButton = this.page.getByTestId(`radio-button-${mode}`);
    await modeButton.click();
  }

  async shuffleColors() {
    const globalTab = this.page.getByTestId(
      "color-modal-list-item-Global settings"
    );
    await globalTab.click();
    const shuffleButton = this.page.getByTestId("shuffle-colors");
    await shuffleButton.click();
  }

  async useColorBlindColors() {
    const globalTab = this.page.getByTestId(
      "color-modal-list-item-Global settings"
    );
    await globalTab.click();
    const colorSettingCheckbox = this.page.getByTestId(
      "checkbox-Use color blind friendly option"
    );
    await colorSettingCheckbox.click();
  }

  async setOpacity(value: number) {}

  async useMultiColorKeypoints() {
    const globalTab = this.page.getByTestId(
      "color-modal-list-item-Global settings"
    );
    await globalTab.click();
    const useMultiColorKeypointsCheckbox = this.page.getByTestId(
      "checkbox-Multicolor keypoints"
    );
    await useMultiColorKeypointsCheckbox.click();
  }

  // field level setting
  async toggleColorMode() {
    const toggleButton = this.page.getByTestId("color-by-toggle");
    await toggleButton.click();
  }

  async useSpecialFieldColor(fieldName: string) {
    const checkbox = this.page.getByTestId(
      `checkbox-Use custom color for ${fieldName} field`
    );
    await checkbox.click();
  }

  async setSpecialFieldColor(fieldName: string, color: string) {}

  // action buttons

  async saveAsDefault() {}

  async resetColorScheme() {}

  async clearDefault() {}
}

class ColorModalAsserter {
  constructor(private readonly ColorModalPom: ColorModalPom) {}
}
