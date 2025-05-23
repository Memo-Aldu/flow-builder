import os
import asyncio
from typing import Optional, Callable, Any

from patchright.async_api import (
    async_playwright,
    Page,
)

from shared.logging import get_logger
from worker.runner.browser.base_browser import BaseBrowser

logger = get_logger(__name__)


class BrightDataBrowser(BaseBrowser):
    """
    Browser implementation using Bright Data's Scraping Browser service.

    Features provided automatically by Bright Data:
    - Automatic proxy rotation via residential proxy network
    - Built-in captcha solving (Cloudflare Turnstile, reCAPTCHA, hCaptcha)
    - Fingerprint randomization and anti-detection
    - Header management and request optimization
    - Automatic unblocking of websites
    """

    def __init__(self) -> None:
        super().__init__()
        self.endpoint_url: Optional[str] = None
        self._setup_credentials()

    def _setup_credentials(self) -> None:
        """Setup Bright Data credentials from environment variables"""
        username = os.environ.get("BRIGHT_DATA_USERNAME")
        password = os.environ.get("BRIGHT_DATA_PASSWORD")

        if not username or not password:
            logger.warning(
                "Bright Data credentials not found. Set BRIGHT_DATA_USERNAME and "
                "BRIGHT_DATA_PASSWORD environment variables."
            )
            self.endpoint_url = None
            return

        auth = f"{username}:{password}"
        self.endpoint_url = f"wss://{auth}@brd.superproxy.io:9222"
        logger.info("Bright Data credentials configured successfully")

    async def start(self, headless: bool = True, log_callback: Optional[Callable] = None) -> None:
        """Start the Bright Data browser"""
        if not self.endpoint_url:
            raise ValueError(
                "Bright Data credentials required. Set BRIGHT_DATA_USERNAME and "
                "BRIGHT_DATA_PASSWORD environment variables."
            )

        try:
            self.playwright = await async_playwright().start()

            logger.info("Connecting to Bright Data Scraping Browser...")
            self.browser = await self.playwright.chromium.connect_over_cdp(self.endpoint_url)
            logger.info("Successfully connected to Bright Data Scraping Browser")

            if not self.browser:
                raise ValueError("Browser not initialized")
            self.context = await self.browser.new_context()

            # Setup popup handling
            await self.setup_popup_handling()

            logger.info("Bright Data browser context created")

        except Exception as e:
            logger.error(f"Failed to start Bright Data browser: {str(e)}")
            raise

    async def new_page(self) -> Page:
        """Create a new page"""
        if not self.context:
            raise ValueError("Browser context not initialized. Call start() first.")

        try:
            self.page = await self.context.new_page()
            logger.info("New Bright Data page created successfully")
            return self.page

        except Exception as e:
            logger.error(f"Failed to create new page: {str(e)}")
            raise

    async def navigate(self, url: str, wait_for_load: bool = True) -> Any:
        """Navigate to URL - Bright Data handles all unblocking automatically"""
        if not self.page:
            raise ValueError("Page not initialized. Call new_page() first.")

        try:
            logger.info(f"Navigating to: {url}")

            response = await self.page.goto(
                url,
                timeout=120000,
                wait_until="domcontentloaded" if wait_for_load else "commit"
            )


            if wait_for_load:
                await self._smart_wait_for_load()

            asyncio.create_task(self.close_modal_dialogs())

            logger.info(f"Successfully navigated to: {url}")
            return response

        except Exception as e:
            logger.error(f"Failed to navigate to {url}: {str(e)}")
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
            await self.page.wait_for_load_state("load", timeout=30000)
            await asyncio.sleep(2)
            await self._wait_for_loading_indicators()
            logger.info("Page loading completed")

        except Exception as e:
            logger.warning(f"Smart wait encountered an issue (non-critical): {str(e)}")

    async def _wait_for_loading_indicators(self) -> None:
        """Wait for common loading indicators to disappear"""
        if not self.page:
            return

        loading_selectors = [
            # Common loading spinners and indicators
            '.loading', '.spinner', '.loader',
            '[data-loading="true"]', '[aria-busy="true"]',
            '.loading-overlay', '.loading-spinner',
            '#loading', '#spinner', '#loader',

            # Framework-specific loaders
            '.ant-spin', '.el-loading-mask', '.v-progress-circular',
            '.mat-progress-spinner', '.ngx-loading',

            # Custom loading text
            ':has-text("Loading...")', ':has-text("Please wait...")',
            ':has-text("Loading")', ':has-text("Cargando")',
        ]

        for selector in loading_selectors:
            try:
                await self.page.wait_for_selector(
                    selector,
                    state="hidden",
                    timeout=10000
                )
                logger.debug(f"Loading indicator disappeared: {selector}")
            except Exception:
                # Ignore if selector doesn't exist or timeout
                continue

    async def fill_input(self, selector: str, text: str, delay: bool = True) -> None:
        """Fill input field"""
        if not self.page:
            raise ValueError("Page not initialized. Call new_page() first.")

        try:
            await self.page.wait_for_selector(selector, timeout=10000)
            await self.page.fill(selector, text)
            logger.debug(f"Filled input {selector}")

        except Exception as e:
            logger.error(f"Failed to fill input {selector}: {str(e)}")
            raise

    async def click(self, selector: str, force: bool = False) -> None:
        """Click element"""
        if not self.page:
            raise ValueError("Page not initialized. Call new_page() first.")

        try:
            await self.page.wait_for_selector(selector, timeout=10000)
            await self.page.click(selector, force=force, timeout=10000)
            logger.debug(f"Clicked element: {selector}")

        except Exception as e:
            logger.error(f"Failed to click {selector}: {str(e)}")
            raise
