import asyncio
from typing import Any, Callable, Optional

from patchright.async_api import (
    async_playwright,
    Page,
)

from shared.logging import get_logger
from shared.models import LogLevel
from worker.runner.browser.base_browser import BaseBrowser

logger = get_logger(__name__)


class NormalBrowser(BaseBrowser):
    """
    Standard browser implementation without stealth features.
    Uses default Playwright settings for a clean browser experience.
    """

    async def start(
        self, headless: bool = True, log_callback: Optional[Callable] = None
    ) -> None:
        """
        Start a standard browser with default settings.

        Args:
            headless: Whether to run the browser in headless mode
            log_callback: Optional callback for logging
        """
        if log_callback:
            log_callback("Starting normal browser...", LogLevel.INFO)

        # Initialize Playwright
        self.playwright = await async_playwright().start()

        # Launch browser with standard options
        self.browser = await self.playwright.chromium.launch(
            headless=headless,
            args=[
                "--disable-dev-shm-usage",
                "--no-sandbox",
            ],
        )

        # Create a default browser context
        self.context = await self.browser.new_context()

        # Set up popup handling
        await self.setup_popup_handling()

        if log_callback:
            log_callback("Normal browser started successfully", LogLevel.INFO)

    async def new_page(self) -> Page:
        """
        Create a new page in the browser context.

        Returns:
            The newly created page
        """
        if not self.context:
            raise ValueError("Browser context not initialized. Call start() first.")

        self.page = await self.context.new_page()
        return self.page

    async def navigate(self, url: str, wait_for_load: bool = True) -> Any:
        """
        Navigate to the specified URL.

        Args:
            url: The URL to navigate to
            wait_for_load: Whether to wait for the page to fully load

        Returns:
            The response from the navigation
        """
        if not self.page:
            raise ValueError("Page not initialized. Call new_page() first.")

        try:
            # Use domcontentloaded for initial navigation (more reliable than networkidle)
            logger.info(f"Navigating to {url}...")
            response = await self.page.goto(
                url, wait_until="domcontentloaded", timeout=60000
            )

            if wait_for_load:
                await self._smart_wait_for_load()

            asyncio.create_task(self.close_modal_dialogs())

            return response

        except Exception as e:
            logger.error(f"Error during navigation to {url}: {str(e)}")
            raise

    async def _smart_wait_for_load(self) -> None:
        """
        Smart loading strategy that doesn't rely on networkidle.

        This approach:
        1. Waits for DOM to be ready
        2. Waits for initial resources to load
        3. Gives time for immediate post-load scripts
        4. Checks for common loading indicators
        """
        if not self.page:
            return

        try:
            logger.info("Waiting for page to load...")

            # Wait for DOM to be ready and initial resources loaded
            await self.page.wait_for_load_state("load", timeout=30000)

            # Give time for immediate post-load scripts and dynamic content
            await asyncio.sleep(2)

            # Wait for common loading indicators to disappear
            await self._wait_for_loading_indicators()

            # Final small delay for any remaining async operations
            await asyncio.sleep(1)

            logger.info("Page loading completed")

        except Exception as e:
            logger.warning(f"Smart wait encountered an issue (non-critical): {str(e)}")
            # Don't fail the navigation if smart wait has issues

    async def _wait_for_loading_indicators(self) -> None:
        """Wait for common loading indicators to disappear"""
        if not self.page:
            return

        loading_selectors = [
            # Common loading spinners and indicators
            ".loading",
            ".spinner",
            ".loader",
            '[data-loading="true"]',
            '[aria-busy="true"]',
            ".loading-overlay",
            ".loading-spinner",
            "#loading",
            "#spinner",
            "#loader",
            # Framework-specific loaders
            ".ant-spin",
            ".el-loading-mask",
            ".v-progress-circular",
            ".mat-progress-spinner",
            ".ngx-loading",
            # Custom loading text
            ':has-text("Loading...")',
            ':has-text("Please wait...")',
            ':has-text("Loading")',
            ':has-text("Cargando")',
        ]

        for selector in loading_selectors:
            try:
                # Wait for loading indicator to disappear (max 10 seconds)
                await self.page.wait_for_selector(
                    selector, state="hidden", timeout=10000
                )
                logger.debug(f"Loading indicator disappeared: {selector}")
            except Exception:
                # Ignore if selector doesn't exist or timeout
                continue

    async def fill_input(self, selector: str, text: str, delay: bool = True) -> None:
        """
        Fill an input field with text.

        Args:
            selector: CSS selector for the input field
            text: Text to enter
            delay: Whether to simulate typing delays (ignored in normal browser)
        """
        if not self.page:
            raise ValueError("Page not initialized")

        await self.page.wait_for_selector(selector, timeout=10000)
        await self.page.fill(selector, text)

    async def click(self, selector: str, force: bool = False) -> None:
        """
        Click on an element.

        Args:
            selector: CSS selector for the element to click
            force: Whether to force the click even if the element is not visible
        """
        if not self.page:
            raise ValueError("Page not initialized")

        # Wait for the element and click it
        await self.page.wait_for_selector(selector, timeout=10000, state="visible")
        await self.page.click(selector, force=force)

    # Popup and modal handling is now inherited from BaseBrowser
    # No need to override these methods unless custom behavior is needed
