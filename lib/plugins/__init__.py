"""
"""
import logging

from abstract import PluginException

_plugins = {}


class _ID(object):

    def __init__(self, ident):
        self._ident = ident

    @property
    def instance(self):
        if has_plugin(self._ident):
            return _plugins[self._ident]
        return None

    def __enter__(self):
        if has_plugin(self._ident):
            return self.instance
        return None

    def __exit__(self, type, value, traceback):
        # we ignore accessing plugins which are not installed
        return self.instance is None and type is AttributeError

    @property
    def name(self):
        return self._ident


class _Names(object):
    DB = _ID('db')
    SESSIONS = _ID('sessions')
    SETTINGS_STORAGE = _ID('settings_storage')
    AUTH = _ID('auth')
    CONC_PERSISTENCE = _ID('conc_persistence')
    CONC_CACHE = _ID('conc_cache')
    EXPORT = _ID('export')
    USER_ITEMS = _ID('user_items')
    MENU_ITEMS = _ID('menu_items')

    GETLANG = _ID('getlang')
    CORPARCH = _ID('corparch')
    QUERY_STORAGE = _ID('query_storage')
    APPLICATION_BAR = _ID('application_bar')
    FOOTER_BAR = _ID('footer_bar')
    LIVE_ATTRIBUTES = _ID('live_attributes')
    SUBC_RESTORE = _ID('subc_restore')
    TAGHELPER = _ID('taghelper')
    SYNTAX_VIEWER = _ID('syntax_viewer')
    SUBCMIXER = _ID('subcmixer')


runtime = _Names()


def install_plugin(name, module, config):
    if isinstance(module.create_instance, PluginFactory):
        _plugins[name] = apply(module.create_instance, (config,))
    else:  # modules without @inject will get just the configuration
        _plugins[name] = apply(module.create_instance, (config,))


def inject_plugin(name, obj):
    """
    Inject a plug-in object directly. This is mainly
    for testing.
    """
    _plugins[name] = obj


def add_missing_plugin(name):
    _plugins[name] = None


def flush_plugins():
    _plugins.clear()


def has_plugin(name):
    return _plugins.get(name) is not None


def load_plugin_module(name):
    _tmp = __import__('plugins', fromlist=[name])
    try:
        module = getattr(_tmp, name)
    except AttributeError:
        logging.getLogger(__name__).error('Plugin %s configured but not installed (missing Python module?)' % name)
        module = None
    return module


def _factory(name):
    if has_plugin(name):
        return _plugins[name]
    else:
        raise PluginException('Plugin %s not installed' % name)


def get(*names):
    """
    This function is deprecated. Use
    plugins.runtime.PLUGIN_NAME instead.
    """
    if len(names) == 1:
        return _factory(names[0])
    else:
        return tuple([_factory(obj) for obj in names])


def get_plugins(include_missing=False):
    """
    returns:
    a dict (plugin_name, plugin_object)
    """
    if not include_missing:
        return dict([(k, v) for k, v in _plugins.items() if v is not None])
    else:
        return _plugins


class PluginFactory(object):
    def __init__(self, fn, *args):
        self._fn = fn
        self._args = args

    def __call__(self, conf):
        return apply(self._fn, (conf,) + self._args)


def inject(*args):
    """
    A decorator allowing a declarative injection of plug-in
    dependencies (= other plug-ins). Plug-ins are injected
    as positional arguments. The first argument is always
    the 'settings' object.

    @inject('db', 'sessions', 'auth')
    def create_instance(conf, db, sessions, auth):
      pass

    arguments:
    one or more plug-in names (see the example)
    """
    def wrapper(func):
        return PluginFactory(func, *[get(v) for v in args])
    return wrapper
