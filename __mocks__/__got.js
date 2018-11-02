async function got (url, options) {
  return {
    body: {
      info: {
        author: 'Joe Bloggs',
        author_email: 'joe.bloggs@example.com',
        project_url: 'http://www.example.com/project',
        classifiers: [
          'Development Status :: 5 - Production/Stable',
          'Intended Audience :: Developers',
          'License :: OSI Approved :: GNU Library or Lesser General Public License (LGPL)',
          'License :: OSI Approved :: Zope Public License',
          'Operating System :: Microsoft :: Windows',
          'Operating System :: Unix',
          'Programming Language :: C',
          'Programming Language :: Python',
          'Programming Language :: Python :: 2',
          'Programming Language :: Python :: 2.6',
          'Programming Language :: Python :: 2.7',
          'Programming Language :: Python :: 3',
          'Programming Language :: Python :: 3.2',
          'Programming Language :: Python :: 3.3',
          'Programming Language :: Python :: 3.4',
          'Programming Language :: Python :: 3.5',
          'Programming Language :: Python :: 3.6',
          'Programming Language :: Python :: Implementation :: CPython',
          'Programming Language :: SQL',
          'Topic :: Database',
          'Topic :: Database :: Front-Ends',
          'Topic :: Software Development',
          'Topic :: Software Development :: Libraries :: Python Modules'
        ],
        keywords: 'test keywords list',
        license: 'Free Software License',
        long_description: 'This is the long description that will be used in priority over description',
        description: 'This probably won\'t be used'
      }
    }
  }
}

module.exports = got