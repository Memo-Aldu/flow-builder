import asyncio
from abc import ABC, abstractmethod
from typing import Any, Callable, Optional

from patchright.async_api import (
    Page,
    BrowserContext,
    Browser,
    Playwright,
)

from shared.logging import get_logger

logger = get_logger(__name__)


class BaseBrowser(ABC):
    """
    Abstract base class for browser implementations.
    Defines the common interface that all browser implementations must follow.
    """

    def __init__(self) -> None:
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.auto_close_popups: bool = True
        self.popup_whitelist: list = []  # URLs or keywords to whitelist (not close)
        self.popup_blacklist: list = [
            "ad",
            "promo",
            "offer",
            "pop",
            "banner",
        ]  # Keywords for popups to close

    @abstractmethod
    async def start(
        self, headless: bool = True, log_callback: Optional[Callable] = None
    ) -> None:
        """
        Start the browser with the specified configuration.

        Args:
            headless: Whether to run the browser in headless mode
            log_callback: Optional callback for logging
        """
        pass

    @abstractmethod
    async def new_page(self) -> Page:
        """
        Create a new page in the browser context.

        Returns:
            The newly created page
        """
        pass

    @abstractmethod
    async def navigate(self, url: str, wait_for_load: bool = True) -> Any:
        """
        Navigate to the specified URL.

        Args:
            url: The URL to navigate to
            wait_for_load: Whether to wait for the page to fully load

        Returns:
            The response from the navigation
        """
        pass

    @abstractmethod
    async def fill_input(self, selector: str, text: str, delay: bool = True) -> None:
        """
        Fill an input field with text.

        Args:
            selector: CSS selector for the input field
            text: Text to enter
            delay: Whether to simulate human-like typing delays
        """
        pass

    @abstractmethod
    async def click(self, selector: str, force: bool = False) -> None:
        """
        Click on an element.

        Args:
            selector: CSS selector for the element to click
            force: Whether to force the click even if the element is not visible
        """
        pass

    async def setup_popup_handling(self) -> None:
        """
        Set up automatic popup detection and closing.
        This should be called after creating a new context.
        """
        if not self.context:
            logger.warning(
                "Cannot setup popup handling: browser context not initialized"
            )
            return

        # Set up popup handler using the unified handler
        self.context.on("page", self._handle_popup_event)
        logger.info("Popup handling configured")

    async def _handle_popup_event(self, popup: Page) -> None:
        """
        Unified popup handler for all browser implementations.

        Args:
            popup: The popup page that was opened
        """
        if not self.auto_close_popups:
            logger.info("Popup detected but auto-close is disabled")
            return

        try:
            url = popup.url
            main_page = self.page

            if main_page and popup == main_page:
                logger.warning("Popup handler was called with the main page - ignoring")
                return

            # Create a separate task to handle the popup to avoid blocking the main flow
            asyncio.create_task(self._close_popup_safely(popup, url, main_page))

        except Exception as e:
            logger.error(f"Error handling popup: {str(e)}")

    async def _close_popup_safely(
        self, popup: Page, url: str, main_page: Optional[Page] = None
    ) -> None:
        """
        Unified method to close a popup safely without disrupting the main page navigation.

        Args:
            popup: The popup page to close
            url: The URL of the popup for logging
            main_page: Reference to the main page to ensure we don't close it
        """
        try:
            # Multiple safety checks to prevent closing the main page
            if (self.page and popup == self.page) or (main_page and popup == main_page):
                logger.warning("Attempted to close main page as popup - ignoring")
                return

            await asyncio.sleep(0.5)

            if popup.is_closed():
                return

            title = "Unknown"
            try:
                title = await popup.title()
            except Exception:
                pass

            logger.info(f"Popup detected: {title} ({url})")

            should_close = self.should_close_popup(url, title)

            if should_close:
                logger.info(f"Closing popup: {title}")

                # Final safety check before closing
                if (self.page and popup == self.page) or (
                    main_page and popup == main_page
                ):
                    logger.warning(
                        "Attempted to close main page as popup (final check) - ignoring"
                    )
                    return

                # Close the popup if it's still open
                if not popup.is_closed():
                    await popup.close()
                    logger.info("Popup closed automatically")
            else:
                logger.info(f"Keeping popup (whitelisted): {title}")

        except Exception as e:
            logger.debug(f"Error closing popup safely: {str(e)}")

    async def close_modal_dialogs(self) -> bool:
        """
        Unified method to close any modal dialogs (like cookie consent, newsletter signup, etc.) on the current page.

        Returns:
            True if any dialogs were closed, False otherwise
        """
        if not self.page:
            return False

        closed_something = False

        try:
            # List of selectors for modal close buttons
            close_selectors = [
                # Generic close buttons
                "button[aria-label='Close'], button[aria-label='close']",
                "button.close, .btn-close, .close-btn",
                "button:has(svg), button:has(i.fa-times), button:has(i.fa-close)",
                "button:has-text('×'), button:has-text('✕'), button:has-text('✖')",
                # Cookie consent dialogs
                "[id*='cookie'] button, [class*='cookie'] button",
                "[id*='consent'] button, [class*='consent'] button",
                '[data-testid="cookie-banner"] button',
                ".cookie-consent button",
                'button:has-text("Accept")',
                'button:has-text("Accept All")',
                'button:has-text("Agree")',
                'button:has-text("No thanks")',
                'button:has-text("Reject")',
                'button:has-text("Close")',
                # Generic popup and modal dialogs
                "[id*='popup'] button, [class*='popup'] button",
                "[id*='modal'] button, [class*='modal'] button",
                "[id*='dialog'] button, [class*='dialog'] button",
                # Newsletter and subscription dialogs
                "[id*='newsletter'] button, [class*='newsletter'] button",
                "[id*='subscribe'] button, [class*='subscribe'] button",
                # Common close button classes
                ".close-button, .modal-close, .popup-close",
                ".dismiss, .dismiss-btn",
                # GDPR and privacy related
                'button:has-text("I understand")',
                'button:has-text("Got it")',
                'button:has-text("OK")',
                'button:has-text("Continue")',
            ]

            # Try each selector
            for selector in close_selectors:
                try:
                    elements = await self.page.query_selector_all(selector)

                    for element in elements:
                        if await element.is_visible():
                            await element.click(timeout=2000)
                            logger.info(
                                f"Closed modal dialog using selector: {selector}"
                            )
                            closed_something = True
                            await asyncio.sleep(0.5)  # Small delay between clicks

                except Exception as e:
                    logger.debug(f"Error trying selector {selector}: {str(e)}")

            return closed_something

        except Exception as e:
            logger.error(f"Error closing modal dialogs: {str(e)}")
            return False

    def should_close_popup(self, url: str, title: str) -> bool:
        """
        Determine if a popup should be closed based on its URL and title.

        Args:
            url: The URL of the popup
            title: The title of the popup

        Returns:
            True if the popup should be closed, False otherwise
        """
        # Check whitelist first (don't close if matches whitelist)
        for keyword in self.popup_whitelist:
            if keyword.lower() in url.lower() or keyword.lower() in title.lower():
                return False

        # Check blacklist (close if matches blacklist)
        for keyword in self.popup_blacklist:
            if keyword.lower() in url.lower() or keyword.lower() in title.lower():
                return True

        # This is a simple heuristic - popups often have about:blank or very short URLs
        return url.startswith("about:") or len(url) < 10 or "popup" in url.lower()

    async def get_page_content(self) -> str:
        """
        Get the current page content.

        Returns:
            The HTML content of the current page
        """
        if not self.page:
            raise ValueError("Page not initialized. Call new_page() first.")

        return await self.page.content()

    async def close(self) -> None:
        """
        Close all browser resources.
        """
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except Exception as e:
            print(f"Error closing browser: {str(e)}")
