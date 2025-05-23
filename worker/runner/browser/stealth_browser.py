import asyncio
import random
from typing import Optional, Callable, Any

from patchright.async_api import (
    async_playwright,
    Page,
)

from shared.logging import get_logger
from worker.runner.browser.base_browser import BaseBrowser

logger = get_logger(__name__)


class StealthBrowser(BaseBrowser):
    """
    Pure stealth browser implementation with manual anti-detection features.

    This browser provides:
    - Manual stealth features and anti-detection
    - User agent and viewport randomization
    - JavaScript injection to hide automation
    - Human-like behavior simulation
    - Popup handling and modal dialog management

    Note: For automatic captcha solving and proxy rotation, use BrightDataBrowser instead.
    """

    def __init__(self) -> None:
        super().__init__()

    async def start(self, headless: bool = True, log_callback: Optional[Callable] = None) -> None:
        """Start the local stealth browser with anti-detection features"""
        try:
            self.playwright = await async_playwright().start()

            logger.info("Starting local stealth browser...")
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=[
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                ]
            )
            logger.info("Local stealth browser started successfully")
            await self._create_stealth_context()

        except Exception as e:
            logger.error(f"Failed to start stealth browser: {str(e)}")
            raise

    async def _create_stealth_context(self) -> None:
        """Create a browser context with stealth settings"""
        try:
            # Random viewport size
            viewport = random.choice([
                {"width": 1920, "height": 1080},
                {"width": 1366, "height": 768},
                {"width": 1536, "height": 864},
                {"width": 1440, "height": 900},
            ])

            # Random user agent
            user_agents = [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
            ]

            context_options = {
                "viewport": viewport,
                "user_agent": random.choice(user_agents),
                "java_script_enabled": True,
                "accept_downloads": False,
                "ignore_https_errors": True,
                "extra_http_headers": {
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Accept-Encoding": "gzip, deflate",
                    "DNT": "1",
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                }
            }

            if not self.browser:
                raise ValueError("Browser not initialized")
            self.context = await self.browser.new_context(**context_options)
            await self.setup_popup_handling()

            logger.info(f"Created stealth context with viewport {viewport['width']}x{viewport['height']}")

        except Exception as e:
            logger.error(f"Failed to create stealth context: {str(e)}")
            raise

    async def new_page(self) -> Page:
        """Create a new page with stealth settings"""
        if not self.context:
            raise ValueError("Browser context not initialized. Call start() first.")

        try:
            self.page = await self.context.new_page()
            await self._inject_stealth_scripts()
            logger.info("New stealth page created successfully")
            return self.page

        except Exception as e:
            logger.error(f"Failed to create new page: {str(e)}")
            raise

    async def _inject_stealth_scripts(self) -> None:
        """Inject JavaScript to hide automation detection"""
        if not self.page:
            return

        stealth_script = """
        (() => {
            'use strict';

            // Hide webdriver property
            try {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                    configurable: true
                });
            } catch (e) {}

            // Mock languages and plugins
            try {
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                    configurable: true
                });
            } catch (e) {}

            try {
                Object.defineProperty(navigator, 'plugins', {
                    get: () => ({
                        length: 3,
                        0: { name: 'Chrome PDF Plugin' },
                        1: { name: 'Chrome PDF Viewer' },
                        2: { name: 'Native Client' }
                    }),
                    configurable: true
                });
            } catch (e) {}

            // Mock permissions API
            try {
                if (window.navigator.permissions && window.navigator.permissions.query) {
                    const originalQuery = window.navigator.permissions.query;
                    window.navigator.permissions.query = (parameters) => {
                        if (parameters.name === 'notifications') {
                            return Promise.resolve({ state: 'default' });
                        }
                        return originalQuery(parameters);
                    };
                }
            } catch (e) {}

            // Hide automation indicators
            try {
                const props = [
                    'cdc_adoQpoasnfa76pfcZLmcfl_Array',
                    'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
                    'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
                    'webdriver',
                    '__webdriver_script_fn',
                    '__driver_evaluate',
                    '__webdriver_evaluate',
                    '__selenium_evaluate',
                    '__fxdriver_evaluate',
                    '__driver_unwrapped',
                    '__webdriver_unwrapped',
                    '__selenium_unwrapped',
                    '__fxdriver_unwrapped'
                ];

                props.forEach(prop => {
                    try {
                        delete window[prop];
                    } catch (e) {}
                });
            } catch (e) {}

            // Override chrome runtime
            try {
                if (!window.chrome) {
                    window.chrome = {};
                }
                if (!window.chrome.runtime) {
                    window.chrome.runtime = {
                        onConnect: undefined,
                        onMessage: undefined
                    };
                }
            } catch (e) {}
        })();
        """

        try:
            await self.page.add_init_script(stealth_script)
            logger.debug("Stealth scripts injected successfully")
        except Exception as e:
            logger.warning(f"Failed to inject stealth scripts: {str(e)}")

    async def navigate(self, url: str, wait_for_load: bool = True) -> Any:
        """Navigate to URL with stealth settings"""
        if not self.page:
            raise ValueError("Page not initialized. Call new_page() first.")

        try:
            logger.info(f"Navigating to: {url}")

            response = await self.page.goto(
                url,
                timeout=60000,
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
                continue

    async def fill_input(self, selector: str, text: str, delay: bool = True) -> None:
        """Fill input with human-like typing"""
        if not self.page:
            raise ValueError("Page not initialized. Call new_page() first.")

        try:
            await self.page.wait_for_selector(selector, timeout=10000)
            await self.page.fill(selector, "")

            if delay:
                await self.page.type(selector, text, delay=random.randint(50, 150))
            else:
                await self.page.fill(selector, text)

            logger.debug(f"Filled input {selector} with text")

        except Exception as e:
            logger.error(f"Failed to fill input {selector}: {str(e)}")
            raise

    async def click(self, selector: str, force: bool = False) -> None:
        """Click element with human-like behavior"""
        if not self.page:
            raise ValueError("Page not initialized. Call new_page() first.")

        try:
            await self.page.wait_for_selector(selector, timeout=10000)
            await asyncio.sleep(random.uniform(0.1, 0.5))
            await self.page.click(selector, force=force, timeout=10000)
            logger.debug(f"Clicked element: {selector}")

        except Exception as e:
            logger.error(f"Failed to click {selector}: {str(e)}")
            raise