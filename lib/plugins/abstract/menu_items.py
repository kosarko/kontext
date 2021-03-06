# Copyright (c) 2015 Charles University in Prague, Faculty of Arts,
#                    Institute of the Czech National Corpus
# Copyright (c) 2015 Tomas Machalek <tomas.machalek@gmail.com>
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; version 2
# dated June, 1991.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

"""
This module provides interface and types needed to implement "menu_items" plug-in properly.
Please note that KonText currently understands only "menu-help" section when inserting
custom menu items into its menu.
"""


class MenuItem(object):
    """
    A general menu item. A list of MenuItem instances
    is expected to be returned by the plug-in.
    """
    def __init__(self, data, lang):
        """
        arguments:
        data -- a dict {'url': string, 'label': string, 'openInBlank': bool}
        lang -- a language+country code (should accept language code only too - e.g. "en")
        """
        self._data = data
        self.lang = lang

    def __repr__(self):
        return 'MenuItem(label: %s, url: %s, lang: %s, blank: %s)' % (self.label, self.url,
                                                                      self.lang, self.open_in_blank)

    @property
    def label(self):
        """
        Return a language dependent label
        """
        return self._data['label']

    @property
    def url(self):
        """
        Return a language dependent URL
        """
        return self._data['url']

    @property
    def open_in_blank(self):
        return self._data.get('openInBlank', False)


class AbstractMenuItems(object):

    def get_items(self, menu_section, lang):
        """
        Return custom menu items which will be appended to the existing ones.

        The method should never raise an exception when asked for non-existing
        undefined sections.

        arguments:
        menu_section -- an identifier of a section (see main_menu module in lib)
        lang -- a language+country (e.g. 'en_US') or language (eng. 'cs') code

        returns:
        a list/tuple of plugin.abstract.menu_items.MenuItem instances
        """
        raise NotImplementedError()
