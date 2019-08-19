"""Tornado handlers for nbexamples web service."""

# pyhton lib
import datetime
from glob import glob
import json
import os
import shutil
import subprocess as sp
from tornado import web
from traitlets.config import LoggingConfigurable
from nbexamples.external.titlecase import titlecase

# Jupyter notebook lib
import nbformat
from notebook.utils import url_path_join as ujoin
from notebook.base.handlers import IPythonHandler


# See python-titlecase README.md. https://github.com/ppannuto/python-titlecase
def abbreviations(word, **kwargs):
    if word.upper() in ('AWS', 'SDK', 'API', 'ML', 'AI'):
        return word.upper()


class Examples(LoggingConfigurable):
    # Path to default customer directory (/home/ec2-user/SageMaker/)
    # TODO: Support better local testing for this parameter
    base_path = '/home/ec2-user/SageMaker/'
    # Path to sample notebook directory (/home/ec2-user/sample-notebooks/)
    sample_notebook_dir = '/home/ec2-user/sample-notebooks/'
    top_sample_notebook_categories = ['introduction_to_applying_machine_learning', 'introduction_to_amazon_algorithms']

    def get_supporting_items(self, filepath, notebook_name):
        notebook_folder_location = os.path.split(filepath)[0]
        items = []
        for root, directories, filenames in os.walk(notebook_folder_location):
            root = root.replace(notebook_folder_location, '')
            for filename in filenames:
                if filename != notebook_name:
                    items.append(os.path.join(root, filename))
        items.sort()
        return items

    def list_examples(self):
        all_examples = []
        for category in self.get_categories():
            directory = os.path.join(self.sample_notebook_dir, category)
            filepaths = glob(os.path.join(directory, '**', '*.ipynb'), recursive=True)
            examples = [{'filepath': os.path.abspath(fp)} for fp in filepaths]
            for example in examples:
                node = nbformat.read(example['filepath'], nbformat.NO_CONVERT)
                example['filename'] = os.path.basename(example['filepath'])
                example['metadata'] = node.metadata
                example['category'] = category
                example['basename'] = os.path.basename(example['filepath'])
                example['supporting_items'] = self.get_supporting_items(example['filepath'], example['filename'])
                notebook_folder_location = os.path.split(example['filepath'])[0]
                example['notebook_folder_name'] = os.path.split(notebook_folder_location)[1]
            all_examples.extend(examples)
        return all_examples

    def get_sanitized_custom_notebook_name(self, custom_notebook_name):
        custom_notebook_basename = os.path.basename(custom_notebook_name)
        custom_notebook_name_without_extension = custom_notebook_basename.split('.')
        sanitized_custom_notebook_name = custom_notebook_name_without_extension[0].strip()
        return sanitized_custom_notebook_name

    def get_customer_notebook_dir_name(self, sample_notebook_location):
        notebook_folder_location = os.path.split(sample_notebook_location)[0]
        notebook_folder_name = os.path.split(notebook_folder_location)[1]

        date = datetime.datetime.utcnow().strftime('%Y-%m-%d')
        destination_location_original = os.path.join(self.base_path, notebook_folder_name) + '_' + date

        # Get non existent version of notebook folder in user space
        copy = 1
        destination_location = destination_location_original
        while os.path.exists(destination_location):
            destination_location = destination_location_original + '_Copy' + str(copy)
            copy += 1

        return destination_location

    def fetch_example(self, sample_notebook_location, custom_notebook_name):
        notebook_folder_location = os.path.split(sample_notebook_location)[0]
        destination_location = self.get_customer_notebook_dir_name(sample_notebook_location)

        # Copy entire content inside notebook folder to customer location
        shutil.copytree(notebook_folder_location, destination_location, symlinks=False, ignore=None)

        # Rename notebook file with user provided name
        original_notebook_name = os.path.join(destination_location, os.path.split(sample_notebook_location)[1])
        sanitized_custom_notebook_name = self.get_sanitized_custom_notebook_name(custom_notebook_name)
        if sanitized_custom_notebook_name:
            customer_provided_notebook_name = os.path.join(destination_location, sanitized_custom_notebook_name + '.ipynb')
            os.rename(original_notebook_name, customer_provided_notebook_name)
        else:
            customer_provided_notebook_name = original_notebook_name

        # Remove base path from customer_provided_notebook_name
        customer_provided_notebook_name = customer_provided_notebook_name.replace(self.base_path, '')
        return customer_provided_notebook_name

    def preview_example(self, filepath):
        fp = filepath  # for brevity
        if not os.path.isfile(fp):
            raise web.HTTPError(404, "Example not found: %s" % fp)
        p = sp.Popen(['jupyter', 'nbconvert', '--to', 'html', '--stdout', fp],
                     stdout=sp.PIPE, stderr=sp.PIPE)
        output, _ = p.communicate()
        retcode = p.poll()
        if retcode != 0:
            raise RuntimeError('nbconvert exited with code {}'.format(retcode))
        return output.decode()

    def get_categories(self):
        return [category_name for category_name in os.listdir(self.sample_notebook_dir)
            if not category_name.startswith('.') and os.path.isdir(os.path.join(self.sample_notebook_dir, category_name))]

    def get_sanitized_categories(self):
        sanitized_categories = []
        for category_name in self.get_categories():
            sanitized_category = {
                'title' : titlecase(category_name.replace('_', ' ').replace('-', ' '), callback=abbreviations),
                'id' : category_name,
                'name' : category_name
            }
            if category_name in self.top_sample_notebook_categories:
                sanitized_categories.insert(0, sanitized_category)
            else:
                sanitized_categories.append(sanitized_category)
        return sanitized_categories

class BaseExampleHandler(IPythonHandler):

    @property
    def manager(self):
        return self.settings['example_manager']


class ExampleCategoryHandler(BaseExampleHandler):
    @web.authenticated
    def get(self):
        self.finish(json.dumps(self.manager.get_sanitized_categories()))


class ExamplesHandler(BaseExampleHandler):
    @web.authenticated
    def get(self):
        self.finish(json.dumps(self.manager.list_examples()))


class ExampleActionHandler(BaseExampleHandler):

    @web.authenticated
    def get(self, action):
        example_id = self.get_argument('example_id')
        if action == 'preview':
            self.finish(self.manager.preview_example(example_id))
        elif action == 'fetch':
            dest = self.get_argument('dest')
            dest = self.manager.fetch_example(example_id, dest)
            self.redirect(ujoin(self.base_url, 'notebooks', dest))
        elif action == 'fetchfile':
            dest = self.get_argument('dest')
            dest = self.manager.fetch_example(example_id, dest)
            self.finish(dest)



# -----------------------------------------------------------------------------
# URL to handler mappings
# -----------------------------------------------------------------------------


_example_action_regex = r"(?P<action>fetch|fetchfile|preview)"

default_handlers = [
    (r"/categories", ExampleCategoryHandler),
    (r"/examples", ExamplesHandler),
    (r"/examples/%s" % _example_action_regex, ExampleActionHandler),
]


def load_jupyter_server_extension(nbapp):
    """Load the nbserver"""
    webapp = nbapp.web_app
    webapp.settings['example_manager'] = Examples(parent=nbapp)
    base_url = webapp.settings['base_url']

    ExampleActionHandler.base_url = base_url  # used to redirect after fetch
    webapp.add_handlers(".*$", [
        (ujoin(base_url, pat), handler)
        for pat, handler in default_handlers
    ])
