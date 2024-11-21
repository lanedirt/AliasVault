FROM jekyll/jekyll:4.2.2

WORKDIR /srv/jekyll
COPY . .
RUN chown -R jekyll:jekyll /srv/jekyll

# Install the theme and dependencies
RUN bundle install
