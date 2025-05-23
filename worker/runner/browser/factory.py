from worker.runner.browser.base_browser import BaseBrowser
from worker.runner.browser.normal_browser import NormalBrowser
from worker.runner.browser.stealth_browser import StealthBrowser
from worker.runner.browser.bright_data_browser import BrightDataBrowser


class BrowserFactory:
    """
    Factory class for creating browser instances.
    """

    @staticmethod
    def create_browser(browser_type: str = "normal") -> BaseBrowser:
        """
        Create a browser instance based on the specified type.

        Args:
            browser_type: The type of browser to create ('normal', 'stealth', or 'brightdata')

        Returns:
            A browser instance of the specified type
        """
        browser_type = browser_type.lower()

        if browser_type == "stealth":
            return StealthBrowser()
        elif browser_type == "brightdata" or browser_type == "bright_data":
            return BrightDataBrowser()
        else:
            return NormalBrowser()
